# socketio_instance.py
from typing import Optional, Any, Dict
from flask_socketio import SocketIO, join_room
from flask import request

# Instance globale (init via: socketio.init_app(app) dans app.py)
# Tu peux fixer async_mode à "eventlet" / "gevent" / "threading" selon ton stack.
socketio = SocketIO(
    cors_allowed_origins="*",
    async_mode=None,          # auto selon env
    ping_timeout=20,
    ping_interval=25,
    logger=False,
    engineio_logger=False,
)

@socketio.on('join')
def on_join(data: Optional[Dict[str, Any]]):
    """
    data attendu: { 'id_utilisateur': <str|int> }
    Le client doit appeler: socket.emit('join', { id_utilisateur })
    """
    try:
        user_id = None
        if isinstance(data, dict) and data.get('id_utilisateur') is not None:
            user_id = str(data['id_utilisateur']).strip()
        if not user_id:
            return
        join_room(user_id)
        print(f"[Socket.IO] User {user_id} joined room {user_id}, SID={getattr(request, 'sid', 'unknown')}")
    except Exception as exc:
        print(f"[Socket.IO] join error: {exc}")

# ----------------- Helpers génériques -----------------

def _normalize_room(room: Any) -> Optional[str]:
    if room is None:
        return None
    r = str(room).strip()
    return r or None

def emit_to_user(user_id: Any, event: str, payload: Dict[str, Any]):
    """Envoie un event à un utilisateur (room = id_utilisateur)."""
    r = _normalize_room(user_id)
    if not r:
        return
    socketio.emit(event, payload, room=r)

def emit_to_role(role: str, event: str, payload: Dict[str, Any]):
    """Envoie un event à une room de rôle (ex.: 'manager', 'admin', 'user', 'super_admin')."""
    r = _normalize_room(role)
    if not r:
        return
    socketio.emit(event, payload, room=r)

def emit_to_manager_dept(dept_id: Any, event: str, payload: Dict[str, Any]):
    """Envoie aux managers d'un département (room = 'manager_dept_<id>')."""
    room_name = f"manager_dept_{dept_id}"
    socketio.emit(event, payload, room=room_name)

# ----------------- Convenience pour notifications -----------------

def emit_notification_to_user(user_id: Any, payload: Dict[str, Any]):
    """Event standard pour notifications temps réel à un utilisateur."""
    emit_to_user(user_id, "notification:new", payload)

def emit_notification_to_role(role: str, payload: Dict[str, Any]):
    """Event standard pour notifications temps réel à un rôle."""
    emit_to_role(role, "notification:new", payload)

def emit_notification_to_manager_dept(dept_id: Any, payload: Dict[str, Any]):
    """Event standard pour notifications temps réel aux managers d'un département."""
    emit_to_manager_dept(dept_id, "notification:new", payload)
