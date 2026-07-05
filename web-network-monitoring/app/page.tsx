import Link from "next/link";

const metrics = [
  { label: "Devices Online", value: "128", tone: "text-emerald-600" },
  { label: "Active Alerts", value: "7", tone: "text-amber-600" },
  { label: "Avg Latency", value: "18ms", tone: "text-cyan-600" },
];

const features = [
  {
    title: "Device Inventory",
    description:
      "Track routers, switches, access points, and servers from one organized device view.",
  },
  {
    title: "Alert Response",
    description:
      "Surface outages, packet loss, and latency changes before they become support tickets.",
  },
  {
    title: "Operational Reports",
    description:
      "Turn logs and device activity into readable reports for reviews and maintenance planning.",
  },
];

export default function Home() {
  return (
    <main className="min-h-screen bg-[#f7f9fb] text-slate-950">
      <section className="relative overflow-hidden bg-[#101820] text-white">
        <div className="absolute inset-0 opacity-40">
          <div className="h-full w-full bg-[linear-gradient(90deg,rgba(255,255,255,0.08)_1px,transparent_1px),linear-gradient(0deg,rgba(255,255,255,0.08)_1px,transparent_1px)] bg-[size:72px_72px]" />
        </div>
        <div className="relative mx-auto flex min-h-[88vh] max-w-7xl flex-col px-6 py-6 lg:px-8">
          <nav className="flex items-center justify-between">
            <Link href="/" className="text-lg font-semibold">
              Network Monitor
            </Link>
            <div className="hidden items-center gap-6 text-sm text-slate-200 md:flex">
              <Link href="/devices" className="hover:text-white">
                Devices
              </Link>
              <Link href="/alerts" className="hover:text-white">
                Alerts
              </Link>
              <Link href="/reports" className="hover:text-white">
                Reports
              </Link>
            </div>
            <Link
              href="/login"
              className="rounded-md border border-white/25 px-4 py-2 text-sm font-medium text-white transition hover:border-white hover:bg-white hover:text-slate-950"
            >
              Login
            </Link>
          </nav>

          <div className="grid flex-1 items-center gap-10 py-16 lg:grid-cols-[0.9fr_1.1fr]">
            <div className="max-w-2xl">
              <p className="mb-5 text-sm font-semibold uppercase text-cyan-300">
                Real-time network visibility
              </p>
              <h1 className="text-5xl font-semibold leading-[1.05] text-white sm:text-6xl">
                Keep every device, alert, and log in view.
              </h1>
              <p className="mt-6 max-w-xl text-lg leading-8 text-slate-200">
                A focused monitoring workspace for teams that need quick
                answers when network conditions change.
              </p>
              <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                <Link
                  href="/dashboard"
                  className="rounded-md bg-cyan-300 px-5 py-3 text-center text-sm font-semibold text-slate-950 transition hover:bg-cyan-200"
                >
                  Open Dashboard
                </Link>
                <Link
                  href="/devices/add"
                  className="rounded-md border border-white/25 px-5 py-3 text-center text-sm font-semibold text-white transition hover:border-white hover:bg-white/10"
                >
                  Add Device
                </Link>
              </div>
            </div>

            <div className="relative min-h-[440px]">
              <div className="absolute left-[8%] top-[8%] h-24 w-24 rounded-full border border-cyan-300/50 bg-cyan-300/10" />
              <div className="absolute right-[12%] top-[18%] h-20 w-20 rounded-full border border-emerald-300/50 bg-emerald-300/10" />
              <div className="absolute bottom-[18%] left-[18%] h-20 w-20 rounded-full border border-amber-300/50 bg-amber-300/10" />
              <div className="absolute bottom-[10%] right-[8%] h-24 w-24 rounded-full border border-rose-300/50 bg-rose-300/10" />
              <div className="absolute left-[22%] top-[28%] h-px w-[45%] rotate-12 bg-cyan-300/50" />
              <div className="absolute bottom-[31%] left-[28%] h-px w-[42%] -rotate-12 bg-emerald-300/50" />
              <div className="absolute left-[44%] top-[25%] h-[52%] w-px rotate-6 bg-amber-300/50" />

              <div className="absolute inset-x-0 bottom-0 mx-auto w-full max-w-xl rounded-lg border border-white/15 bg-white/95 p-4 text-slate-950 shadow-2xl">
                <div className="flex items-center justify-between border-b border-slate-200 pb-3">
                  <div>
                    <p className="text-xs font-semibold uppercase text-slate-500">
                      Live Network Status
                    </p>
                    <h2 className="mt-1 text-lg font-semibold">
                      Core Infrastructure
                    </h2>
                  </div>
                  <span className="rounded-md bg-emerald-100 px-3 py-1 text-xs font-semibold text-emerald-700">
                    Stable
                  </span>
                </div>
                <div className="grid gap-3 py-4 sm:grid-cols-3">
                  {metrics.map((metric) => (
                    <div
                      key={metric.label}
                      className="rounded-md border border-slate-200 bg-slate-50 p-3"
                    >
                      <p className="text-xs text-slate-500">{metric.label}</p>
                      <p className={`mt-2 text-2xl font-semibold ${metric.tone}`}>
                        {metric.value}
                      </p>
                    </div>
                  ))}
                </div>
                <div className="space-y-3">
                  {["Gateway-01", "Switch-Floor-2", "AP-East-Wing"].map(
                    (device, index) => (
                      <div
                        key={device}
                        className="grid grid-cols-[1fr_auto] items-center gap-4"
                      >
                        <span className="text-sm font-medium">{device}</span>
                        <div className="h-2 w-36 overflow-hidden rounded-full bg-slate-200">
                          <div
                            className="h-full rounded-full bg-cyan-500"
                            style={{ width: `${92 - index * 12}%` }}
                          />
                        </div>
                      </div>
                    ),
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto grid max-w-7xl gap-4 px-6 py-12 lg:grid-cols-3 lg:px-8">
        {features.map((feature) => (
          <article
            key={feature.title}
            className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm"
          >
            <h2 className="text-xl font-semibold text-slate-950">
              {feature.title}
            </h2>
            <p className="mt-3 leading-7 text-slate-600">
              {feature.description}
            </p>
          </article>
        ))}
      </section>
    </main>
  );
}
