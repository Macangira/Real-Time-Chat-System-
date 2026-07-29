from fastapi import APIRouter, BackgroundTasks, Depends, Form, status

from app.schema.user import UserCreate , LoginSchema
from app.services.users import UserServices
from app.services.email import Mail
from app.utils.deps import get_current_user

router = APIRouter(
    prefix="/auth",
    tags=["Authentication"]
)


@router.post(
    "/register",
    status_code=status.HTTP_201_CREATED
)
async def register(
    request: UserCreate,
    background_tasks: BackgroundTasks
):
    user, email_data, replacements = await UserServices.create_user(request)

    # background_tasks.add_task(
    #     Mail,
    #     email_data,
    #     "register.html",
    #     replacements
    # )

    return {
        "message": "User registered successfully",
        "data": user
    }


@router.post("/login")
async def login(
    login_req : LoginSchema
):
    return await UserServices.login(
        login_req.username,
        login_req.password
    )


@router.post("/send-otp")
async def send_otp(
    username: str,
    otp_type: str
):
    replacements, email_data = await UserServices.send_otp(
        username,
        otp_type
    )

    # await Mail(
    #     email_data,
    #     "otp.html",
    #     replacements
    # )

    # return {
    #     "message": "OTP sent successfully"
    # }


@router.post("/verify-email")
async def verify_email(
    username: str = Form(...),
    otp: str = Form(...)
):
    return await UserServices.verify_email(
        username=username,
        otp=otp
    )


@router.get("/me")
async def get_me(
    current_user=Depends(get_current_user)
):
    return {
        "user_id": str(current_user.id),
        "username": current_user.username,
        "first_name": current_user.first_name,
        "last_name": current_user.last_name,
        "email": current_user.email,
        "is_active": current_user.is_active,
        "is_emailverified": current_user.is_emailverified,
    }


@router.get("/{user_id}")
async def get_user_by_id(
    user_id: str
):
    return await UserServices.get_user_by_id(
        user_id
    )