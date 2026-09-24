# XAI Physiotherapy - File Descriptions

## Core System Files

### main.py
- **Purpose**: Entry point and main menu system
- **Function**: Discovers exercises dynamically from exercises/ directory, presents menu to user, launches selected exercise
- **Key Features**: Dynamic module loading, exercise discovery, menu navigation, clean exit handling

### exercise_runner.py
- **Purpose**: Main analysis engine for all exercises
- **Function**: Handles both dynamic (rep-based) and isometric (hold-based) exercise types
- **Key Components**:
  - MediaPipe pose detection integration
  - Real-time joint angle computation
  - Rep counting state machine
  - Isometric hold timing system
  - HUD overlay rendering
  - Voice alert system
  - Gemini report generation

### exercise_base.py
- **Purpose**: Core data structures and type definitions
- **Classes**:
  - `JointCheck`: Defines angle-based joint monitoring with thresholds and alerts
  - `RepTrigger`: Configures rep counting logic for dynamic exercises
  - `IsometricTrigger`: Configures hold timing for isometric exercises
  - `ExerciseDefinition`: Complete exercise specification container

### config.py
- **Purpose**: Centralized configuration management
- **Configurable Parameters**:
  - MediaPipe model selection (Lite/Full)
  - API keys (ElevenLabs, Gemini)
  - Camera settings (index, resolution, detection scale)
  - Smoothing parameters (EMA alpha, visibility threshold)
  - Voice cooldown timing
  - Exercise-specific thresholds (squat angles, form checks)

## Computer Vision Layer

### landmarks.py
- **Purpose**: MediaPipe landmark mapping and utilities
- **Function**: Provides standardized landmark names and indices for consistent access
- **Features**: Landmark enumeration, coordinate conversion helpers

### math_utils.py
- **Purpose**: Geometric calculations and utilities
- **Functions**:
  - `angle_2d()`: 2D angle calculation from three points
  - `angle_3d()`: 3D angle calculation from three landmarks
  - `build_pts()`: Converts MediaPipe landmarks to screen coordinates
  - `detect_view()`: Determines if user is facing front or side view

### smoother.py
- **Purpose**: Data smoothing and stabilization
- **Function**: Applies exponential moving average to landmark positions
- **Benefits**: Reduces jitter, improves tracking stability, filters noise

### drawing.py
- **Purpose**: Visualization and rendering
- **Function**: Draws skeleton overlay, joint angles, and annotations on video frames
- **Features**: Color-coded feedback, customizable styling, transparent HUD elements

## Exercise Definitions

### exercises/bicep_curl.py
- **Purpose**: Bicep curl exercise definition
- **Type**: Dynamic (rep-based)
- **Checks**: Elbow angle monitoring, rep counting, form validation

### exercises/squat.py
- **Purpose**: Squat exercise definition
- **Type**: Dynamic (rep-based)
- **Checks**: Knee angle tracking, depth validation, posture monitoring

### exercises/isometric_quadriceps_for_knee_mobility.py
- **Purpose**: Isometric quadriceps hold exercise
- **Type**: Isometric (hold-based)
- **Checks**: Knee angle hold zone, timing, position maintenance

### posture_checks.py
- **Purpose**: Advanced form validation checks
- **Function**: Contains callable functions for non-angle-based posture validation
- **Examples**: Back lean detection, knee cave-in, heel lift, butt wink, neck position

## External Services

### voice.py
- **Purpose**: Text-to-speech feedback system
- **Integration**: ElevenLabs API for natural voice synthesis
- **Features**: Alert cooldown, voice selection, real-time feedback

### gemini.py
- **Purpose**: AI coaching and analysis reports
- **Integration**: Google Gemini API for post-session analysis
- **Function**: Generates personalized coaching feedback based on session data

## Administrative Tools

### admin.py
- **Purpose**: Exercise creation and management interface
- **Function**: Guides users through creating new exercise definitions
- **Features**: Interactive wizard, template generation, validation

## Support Files

### requirements.txt
- **Purpose**: Python dependency specification
- **Key Dependencies**: mediapipe, opencv-python, numpy, requests

### pose_landmarker.task
- **Purpose**: MediaPipe pose detection model file
- **Note**: Must be downloaded separately (Lite or Full version)

## File Relationships

- **main.py** → discovers and loads exercise files
- **exercise files** → depend on exercise_base.py for data structures
- **exercise_runner.py** → uses all CV components (landmarks, math_utils, smoother, drawing)
- **exercise_runner.py** → integrates with external services (voice.py, gemini.py)
- **config.py** → provides parameters to all components
- **posture_checks.py** → provides additional validation functions to exercises

## Modular Design Benefits

1. **Exercise Independence**: Each exercise is self-contained in its own file
2. **Easy Extension**: Add new exercises by creating new Python files in exercises/
3. **Centralized Logic**: exercise_runner handles all exercise types generically
4. **Configurable**: All parameters tunable via config.py without code changes
5. **Service Agnostic**: External services can be swapped without affecting core logic