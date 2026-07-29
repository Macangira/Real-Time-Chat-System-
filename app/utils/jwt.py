from datetime import datetime , timezone , timedelta
from jose import jwt , JWTError
from fastapi import HTTPException

from app.config.settings import settings

def create_access_token(data : dict):

    to_encode = data.copy()
    expire = datetime.now(timezone.utc) + timedelta(minutes= settings.access_token_expire_minutes)
    to_encode.update({"exp" : expire, "token_type": "access"})
    encoded_jwt = jwt.encode(
        to_encode,
        settings.secret_key,
        algorithm=settings.algorithm
    )

    return encoded_jwt , expire

def verify_access_token(token : str):
    try : 
        payload = jwt.decode(
            token,
            settings.secret_key,
            algorithms=[settings.algorithm]
        )
        username : str = payload.get("sub")
        if username is None:
            raise HTTPException(
                status_code=401,
                detail="Could not vaildate credentials"
            )
        return payload
    except JWTError:
        raise HTTPException(
                status_code=401,
                detail="Could not vaildate credentials"
            )

def create_refresh_token(data : dict):
    payload = data.copy()
    expire = datetime.now(timezone.utc) + timedelta(days=7)
    payload.update({"exp" : expire, "token_type": "refresh"})
    refresh_token = jwt.encode(payload , settings.secret_key , algorithm=settings.algorithm)
    return refresh_token , expire