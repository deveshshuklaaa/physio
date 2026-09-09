(async () => {
  try {
    const mod = await import("/src/assets/vendor/mediapipe/vision_bundle.mjs");
    const { FilesetResolver, PoseLandmarker } = mod;
    const fileset = await FilesetResolver.forVisionTasks("/src/assets/vendor/mediapipe/wasm/");
    const landmarker = await PoseLandmarker.createFromOptions(fileset, {
      baseOptions: { modelAssetPath: "/src/assets/vendor/mediapipe/models/pose_landmarker_lite.task", delegate: "CPU" },
      runningMode: "VIDEO",
      numPoses: 1,
    });
    postMessage({ ok: true });
  } catch (e) {
    postMessage({ ok: false, error: String(e && e.stack || e) });
  }
})();
