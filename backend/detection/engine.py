"""
Detection Engine
- Motion detection via frame differencing (OpenCV)
- Sleep/Awake state from motion level
- Cry detection via audio amplitude threshold
"""
import cv2
import numpy as np
import base64
import random
import math
from datetime import datetime


class MotionDetector:
    def __init__(self, threshold=25, min_area=500):
        self.threshold = threshold
        self.min_area = min_area
        self.prev_frame = None
        self.bg_subtractor = cv2.createBackgroundSubtractorMOG2(history=100, varThreshold=40)

    def detect(self, frame_bytes: bytes) -> dict:
        """Detect motion in a JPEG frame. Returns motion result dict."""
        try:
            nparr = np.frombuffer(frame_bytes, np.uint8)
            frame = cv2.imdecode(nparr, cv2.IMREAD_GRAYSCALE)
            if frame is None:
                return self._no_motion()

            blurred = cv2.GaussianBlur(frame, (21, 21), 0)
            fg_mask = self.bg_subtractor.apply(blurred)
            _, thresh = cv2.threshold(fg_mask, self.threshold, 255, cv2.THRESH_BINARY)
            dilated = cv2.dilate(thresh, None, iterations=2)

            contours, _ = cv2.findContours(dilated, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)
            motion_contours = [c for c in contours if cv2.contourArea(c) > self.min_area]

            total_motion_area = sum(cv2.contourArea(c) for c in motion_contours)
            frame_area = frame.shape[0] * frame.shape[1]
            motion_ratio = total_motion_area / frame_area if frame_area > 0 else 0

            detected = len(motion_contours) > 0
            confidence = min(motion_ratio * 10, 1.0)

            return {
                'detected': detected,
                'confidence': round(confidence, 3),
                'motion_level': round(motion_ratio * 100, 2),
                'contour_count': len(motion_contours),
            }
        except Exception as e:
            return self._no_motion()

    def _no_motion(self):
        return {'detected': False, 'confidence': 0, 'motion_level': 0, 'contour_count': 0}


class SleepAwakeDetector:
    """Determines sleep/awake state from motion history."""

    def __init__(self, window_size=10):
        self.window_size = window_size
        self.motion_history = []

    def update(self, motion_detected: bool, motion_level: float) -> dict:
        self.motion_history.append(motion_level)
        if len(self.motion_history) > self.window_size:
            self.motion_history.pop(0)

        avg_motion = sum(self.motion_history) / len(self.motion_history)
        is_awake = avg_motion > 2.0  # >2% average motion → awake

        return {
            'state': 'awake' if is_awake else 'sleep',
            'confidence': min(abs(avg_motion - 2.0) / 5.0 + 0.5, 1.0),
            'avg_motion_level': round(avg_motion, 2),
        }


class CryDetector:
    """Basic amplitude-threshold cry detector (simulated or real)."""

    THRESHOLD_DB = -20  # dBFS threshold for cry

    @staticmethod
    def detect_from_level(amplitude_db: float) -> dict:
        """Detect cry from audio amplitude in dBFS."""
        is_crying = amplitude_db > CryDetector.THRESHOLD_DB
        confidence = max(0, min((amplitude_db - CryDetector.THRESHOLD_DB) / 20.0, 1.0))

        return {
            'crying': is_crying,
            'confidence': round(confidence, 3),
            'amplitude_db': round(amplitude_db, 1),
        }

    @staticmethod
    def simulate() -> dict:
        """Simulate audio detection (10% chance of cry)."""
        is_crying = random.random() < 0.10
        amplitude = random.uniform(-5, 0) if is_crying else random.uniform(-40, -25)
        return CryDetector.detect_from_level(amplitude)


class DetectionService:
    """High-level service combining all detectors."""

    def __init__(self):
        self.motion_detector = MotionDetector()
        self.sleep_detector = SleepAwakeDetector()

    def process_frame(self, frame_bytes: bytes, simulate_audio: bool = True) -> dict:
        motion_result = self.motion_detector.detect(frame_bytes)
        sleep_result = self.sleep_detector.update(
            motion_result['detected'],
            motion_result['motion_level']
        )
        cry_result = CryDetector.simulate() if simulate_audio else {'crying': False, 'confidence': 0, 'amplitude_db': -50}

        return {
            'motion': motion_result,
            'sleep_state': sleep_result,
            'cry': cry_result,
            'timestamp': datetime.utcnow().isoformat(),
        }

    def simulate_full(self) -> dict:
        """Simulate all sensors without a real frame (for testing)."""
        hour = datetime.utcnow().hour
        # babies more active during day
        motion_level = abs(math.sin(hour * math.pi / 12)) * 5 + random.uniform(0, 2)
        motion_detected = motion_level > 2

        motion_result = {
            'detected': motion_detected,
            'confidence': min(motion_level / 10, 1.0),
            'motion_level': round(motion_level, 2),
            'contour_count': random.randint(0, 3) if motion_detected else 0,
        }
        sleep_result = self.sleep_detector.update(motion_detected, motion_level)
        cry_result = CryDetector.simulate()

        return {
            'motion': motion_result,
            'sleep_state': sleep_result,
            'cry': cry_result,
            'timestamp': datetime.utcnow().isoformat(),
            'simulated': True,
        }


# Singleton service instance
detection_service = DetectionService()