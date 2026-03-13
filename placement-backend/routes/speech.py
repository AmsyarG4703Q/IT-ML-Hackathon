import os
import tempfile
from flask import Blueprint, request, jsonify
from openai import OpenAI

speech_bp = Blueprint('speech', __name__)

# ── Load API key from env or config ────────────────────────
# Set OPENAI_API_KEY in your environment or .env file
client = OpenAI(api_key=os.environ.get('OPENAI_API_KEY', ''))

ALLOWED_AUDIO_TYPES = {
    'audio/webm', 'audio/ogg', 'audio/wav', 'audio/mp4',
    'audio/mpeg', 'audio/mp3', 'audio/x-m4a',
}

@speech_bp.route('/transcribe', methods=['POST'])
def transcribe():
    """
    Accepts an audio file (blob from MediaRecorder) and returns
    the Whisper transcription.

    Form-data: audio_file (binary)
    Returns: { transcript: str, duration: float, language: str }
    """
    if not client.api_key:
        return jsonify({'error': 'OPENAI_API_KEY not configured on the server.'}), 500

    if 'audio_file' not in request.files:
        return jsonify({'error': 'No audio_file provided'}), 400

    audio = request.files['audio_file']
    content_type = audio.content_type or 'audio/webm'

    if content_type not in ALLOWED_AUDIO_TYPES:
        # Accept anyway — Whisper handles most formats
        pass

    # Determine file extension for Whisper (it needs a filename hint)
    ext_map = {
        'audio/webm': '.webm', 'audio/ogg': '.ogg', 'audio/wav': '.wav',
        'audio/mp4': '.mp4',  'audio/mpeg': '.mp3', 'audio/mp3': '.mp3',
        'audio/x-m4a': '.m4a',
    }
    ext = ext_map.get(content_type, '.webm')

    # Write to a temp file (Whisper API needs a real file handle)
    with tempfile.NamedTemporaryFile(suffix=ext, delete=False) as tmp:
        audio.save(tmp.name)
        tmp_path = tmp.name

    try:
        with open(tmp_path, 'rb') as f:
            response = client.audio.transcriptions.create(
                model='whisper-1',
                file=f,
                response_format='verbose_json',   # includes duration, language
                language='en',
            )
        return jsonify({
            'transcript': response.text,
            'duration':   getattr(response, 'duration', 0),
            'language':   getattr(response, 'language', 'en'),
        })
    except Exception as e:
        return jsonify({'error': str(e)}), 500
    finally:
        try:
            os.remove(tmp_path)
        except Exception:
            pass
