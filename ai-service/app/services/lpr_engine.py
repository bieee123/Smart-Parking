"""License Plate Recognition (LPR) engine.

Uses ONNX Runtime for inference when a model file exists.
Falls back to a deterministic mock inference so the service
is fully functional without real model files during development.
"""
import os
import logging
import numpy as np

from app.config import LPR_MODEL_PATH, LPR_CONFIDENCE_THRESHOLD

logger = logging.getLogger(__name__)

# Sample plates the mock recogniser cycles through
_SAMPLE_PLATES = [
    "B 1234 XYZ",
    "B 5678 ABC",
    "B 9012 DEF",
    "B 3456 GHI",
    "B 7890 JKL",
    "D 1111 AAA",
    "AB 2222 BB",
]


class LPREngine:
    """Wrapper around the LPR ONNX model (or mock fallback)."""

    def __init__(self, model_path: str = LPR_MODEL_PATH):
        self.model_path = model_path
        self.session = None
        self._load_model()

    def _load_model(self) -> None:
        """Attempt to load the ONNX model. Log a warning and stay in mock mode if unavailable."""
        if not os.path.isfile(self.model_path):
            logger.warning("LPR model not found at %s — using mock inference", self.model_path)
            return

        try:
            import onnxruntime as ort
            self.session = ort.InferenceSession(self.model_path, providers=["CPUExecutionProvider"])
            logger.info("LPR model loaded successfully from %s", self.model_path)
        except Exception as exc:
            logger.error("Failed to load LPR model: %s — falling back to mock", exc)
            self.session = None

    def predict(self, image_bytes: bytes) -> dict:
        """Run plate recognition.

        Parameters
        ----------
        image_bytes : bytes
            Raw image data (JPEG/PNG/…).

        Returns
        -------
        dict
            {"plate": str, "confidence": float}
        """
        if self.session is not None:
            return self._predict_onnx(image_bytes)
        return self._predict_mock(image_bytes)

    # ── ONNX inference ────────────────────────────────────────
    def _predict_onnx(self, image_bytes: bytes) -> dict:
        """Real ONNX Runtime inference (placeholder for actual model I/O)."""
        import cv2
        from app.utils.image_tools import bytes_to_cv2, resize_to_max_edge

        img = bytes_to_cv2(image_bytes)
        img = resize_to_max_edge(img, 640)

        # Pre-process: BGR → RGB → normalize → add batch dim
        rgb = cv2.cvtColor(img, cv2.COLOR_BGR2RGB)
        blob = rgb.astype(np.float32) / 255.0
        blob = np.expand_dims(blob, axis=0)  # (1, H, W, 3)

        input_name = self.session.get_inputs()[0].name
        outputs = self.session.run(None, {input_name: blob})

        # Decode model output — adapt to your actual model's output shape
        # Expected: list of (plate_text, confidence)
        plate, conf = self._decode_onnx_output(outputs)
        return {"plate": plate, "confidence": float(conf)}

    @staticmethod
    def _decode_onnx_output(outputs: list) -> tuple[str, float]:
        """Decode raw ONNX output tensors to (plate_text, confidence).

        TODO: Replace with the actual decoding logic matching your model.
        """
        raw = outputs[0]
        # Example: first element is CTC decoded string index, second is confidence
        plate = "B 0000 ??? (onnx)"
        conf = float(np.max(raw))
        return plate, conf

    # ── Mock inference (fully functional without model file) ──
    @staticmethod
    def _predict_mock(image_bytes: bytes) -> dict:
        """Deterministic mock: pick a plate based on byte-length hash.

        Same image → same plate every time. Different images → different plates.
        Confidence is always above the threshold to simulate a working model.
        """
        # Deterministic index from image content
        idx = hash(image_bytes) % len(_SAMPLE_PLATES)
        plate = _SAMPLE_PLATES[idx]

        # Simulate confidence between 0.82 and 0.97
        conf = 0.82 + (hash(image_bytes) % 15) / 100.0

        return {"plate": plate, "confidence": round(conf, 4)}


# Singleton instance (loaded once at startup)
lpr_engine = LPREngine()
