import argparse
import json
import os
import platform
import subprocess
import time
from datetime import datetime, timezone
from typing import Any

import firebase_admin
from firebase_admin import credentials, firestore


PROJECT_ID = os.getenv("FIREBASE_PROJECT_ID", "network-monitoring-7b445")
INTERVAL_SECONDS = int(os.getenv("AGENT_INTERVAL_SECONDS", "60"))
PING_TIMEOUT_MS = int(os.getenv("AGENT_PING_TIMEOUT_MS", "4000"))


def initialize_firebase() -> None:
    if firebase_admin._apps:
        return

    service_account_json = os.getenv("FIREBASE_SERVICE_ACCOUNT_JSON")
    if service_account_json:
        credential = credentials.Certificate(json.loads(service_account_json))
        firebase_admin.initialize_app(credential, {"projectId": PROJECT_ID})
        return

    credential = credentials.ApplicationDefault()
    firebase_admin.initialize_app(credential, {"projectId": PROJECT_ID})


def get_ping_command(ip_address: str) -> list[str]:
    if platform.system().lower() == "windows":
        return ["ping", "-n", "1", "-w", str(PING_TIMEOUT_MS), ip_address]

    timeout_seconds = max(1, round(PING_TIMEOUT_MS / 1000))
    return ["ping", "-c", "1", "-W", str(timeout_seconds), ip_address]


def ping_device(ip_address: str) -> dict[str, Any]:
    command = get_ping_command(ip_address)
    started_at = time.perf_counter()

    try:
        subprocess.run(
            command,
            check=True,
            capture_output=True,
            text=True,
            timeout=(PING_TIMEOUT_MS / 1000) + 1,
        )
        response_time = round((time.perf_counter() - started_at) * 1000)
        return {"status": "online", "responseTime": response_time}
    except (subprocess.CalledProcessError, subprocess.TimeoutExpired):
        return {"status": "offline", "responseTime": None}


def create_monitoring_log(
    db: firestore.Client,
    device: dict[str, Any],
    device_id: str,
    result: dict[str, Any],
    checked_at: datetime,
) -> None:
    db.collection("monitoringLogs").add(
        {
            "deviceId": device_id,
            "deviceName": device.get("name", "Unknown device"),
            "ipAddress": device.get("ipAddress", ""),
            "ownerId": device.get("ownerId", ""),
            "status": result["status"],
            "responseTime": result["responseTime"],
            "checkedAt": checked_at,
            "createdAt": firestore.SERVER_TIMESTAMP,
        }
    )


def ensure_offline_alert(
    db: firestore.Client,
    device: dict[str, Any],
    device_id: str,
    checked_at: datetime,
) -> None:
    existing_alerts = (
        db.collection("alerts")
        .where("deviceId", "==", device_id)
        .where("ownerId", "==", device.get("ownerId", ""))
        .where("status", "==", "unread")
        .limit(1)
        .stream()
    )

    if any(existing_alerts):
        return

    device_name = device.get("name", "Unknown device")
    alert_ref = db.collection("alerts").document()
    alert_ref.set(
      {
          "alertId": alert_ref.id,
          "deviceId": device_id,
          "deviceName": device_name,
          "ownerId": device.get("ownerId", ""),
          "message": f"{device_name} is offline",
          "severity": "high",
          "status": "unread",
          "createdAt": checked_at,
      }
    )


def resolve_open_alerts(
    db: firestore.Client,
    device: dict[str, Any],
    device_id: str,
) -> None:
    open_alerts = list(
        db.collection("alerts")
        .where("deviceId", "==", device_id)
        .where("ownerId", "==", device.get("ownerId", ""))
        .where("status", "==", "unread")
        .stream()
    )

    if not open_alerts:
        return

    batch = db.batch()
    for alert_snapshot in open_alerts:
        batch.update(
            alert_snapshot.reference,
            {
                "status": "read",
                "resolvedAt": firestore.SERVER_TIMESTAMP,
            },
        )
    batch.commit()


def monitor_devices() -> None:
    db = firestore.client()
    device_snapshots = list(db.collection("devices").stream())

    if not device_snapshots:
        print("No devices found.")
        return

    for device_snapshot in device_snapshots:
        device = device_snapshot.to_dict()
        device_id = device_snapshot.id
        ip_address = device.get("ipAddress")

        if not ip_address:
            print(f"{device.get('name', device_id)}: skipped, missing IP address")
            continue

        result = ping_device(ip_address)
        previous_status = device.get("status", "unknown")
        checked_at = datetime.now(timezone.utc)

        device_snapshot.reference.update(
            {
                "status": result["status"],
                "responseTime": result["responseTime"],
                "lastChecked": checked_at,
                "updatedAt": firestore.SERVER_TIMESTAMP,
            }
        )
        create_monitoring_log(db, device, device_id, result, checked_at)

        if result["status"] == "offline":
            ensure_offline_alert(db, device, device_id, checked_at)
        else:
            resolve_open_alerts(db, device, device_id)

        response_time = (
            "timeout"
            if result["responseTime"] is None
            else f"{result['responseTime']}ms"
        )
        print(
            f"{device.get('name', device_id)} ({ip_address}): "
            f"{previous_status} -> {result['status']} ({response_time})"
        )


def run() -> None:
    parser = argparse.ArgumentParser(description="Network monitoring agent")
    parser.add_argument(
        "--watch",
        action="store_true",
        help="Run continuously using AGENT_INTERVAL_SECONDS.",
    )
    args = parser.parse_args()

    initialize_firebase()

    if args.watch:
        print(f"Monitoring devices every {INTERVAL_SECONDS} seconds...")
        while True:
            try:
                monitor_devices()
            except Exception as error:
                print(f"Monitoring cycle failed: {error}")
            time.sleep(INTERVAL_SECONDS)
        return

    monitor_devices()


if __name__ == "__main__":
    run()
