from fastapi import Depends , HTTPException 
from fastapi.security import HTTPBearer , HTTPBasicCredentials
from app.utils.jwt import verify_access_token
from app.models.user import User

security = HTTPBearer()

async def get_current_user(credentials : HTTPBasicCredentials = Depends(security)):

    token = credentials.credentials
    payload = verify_access_token(token)

    username = payload.get("sub")
    if not username:
        raise HTTPException(
            status_code=401,
            detail="Could not validate credentials")
    current_user = await User.find_one(User.username == username)
    
    if not current_user:
        raise

    return current_user