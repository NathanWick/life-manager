export default function OfflinePage() {
  return (
    <div className="min-h-dvh flex flex-col items-center justify-center p-6 text-center">
      <h1 className="text-xl font-semibold mb-2">You&apos;re offline</h1>
      <p className="text-muted-foreground text-sm">
        LifeQuest will sync when you&apos;re back online. Your data is saved on
        this device.
      </p>
    </div>
  );
}
