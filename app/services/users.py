from fastapi import HTTPException , status
from  beanie import PydanticObjectId
from datetime import datetime , timezone 
import time
import traceback
import random

#files import
from app.schema.user import UserCreate 
from app.utils.jwt import create_access_token , create_refresh_token
from app.utils.security import hash_password , verify_password 
from app.models.user import User
from app.models.opt import OTP
from app.config.logger import logger
class UserServices:

    @staticmethod
    async def create_user(request : UserCreate):
        try:
            check_username = await User.find_one(
                User.username == request.username,
                User.deletedAt == None
            )

            if check_username:
                raise HTTPException(
                    status_code= status.HTTP_400_BAD_REQUEST,
                    detail="this username is already exist"
                )
            hashed_password = hash_password(request.password)
            user=User(
                **request.model_dump(exclude="password"),
                password=hashed_password
            )
            await user.insert()


            emailData = {
                "to" : request.email,
                "subject" :"You Successfully Register To ChatSessions... please verify your email now"
            }
            replacements = {
                "company_name" :"ChatSession",
                "username" : request.username,
                "email" : user.email,
                "login_url" : "http://127.0.0.1:3000/verify_otp",
                "support_email" : "mukulangira072@gmail.com",
                "year" : 2026
            }
            logger.info(f"User Register Successfully: {request.username}")
            return user , emailData , replacements
        except HTTPException:
            raise
        except Exception as e:
            logger.error(f"Failed to Register User in DB : {str(e)}")
            raise

    @staticmethod
    async def login(username :str , password : str):
        try:
            username = username.strip()
            password = password.strip()

            user = await User.find_one(
                User.username == username,
                User.deletedAt == None
            )

            if not user:
                raise HTTPException(
                    status_code=404,
                    detail="user not found"
                )

            #verify password
            if (not verify_password(password , user.password)):
                raise HTTPException(
                    status_code=404,
                    detail="User not Found"
                )

            # if not user.is_emailverified:
            #     try:
            #         await UserServices.send_otp(user.username , "Email Verification")
            #         logger.info("Verification Email send")
            #     except Exception as e:
            #         logger.error(f"Failed to send otp in during login :{str(e)}")
            #         raise
            data = {
                "sub" : user.username
            }

            access_token , _ = create_access_token(data)
            refresh_token , expire = create_refresh_token(data)

            user.token = refresh_token
            user.last_login = datetime.now(timezone.utc)
            await user.save()
            return {
                "access_token": access_token,
                "refresh_token": refresh_token,
                "user_id": str(user.id),
                "username": user.username
            }
        
        except HTTPException:
            raise
        except Exception as e:
            logger.error(f"Failed to Register User in DB : {str(e)}")
            raise

    @staticmethod 
    async def send_otp(username : str , type : str):
        try:
            user = await User.find_one(
                User.username == username,
                User.deletedAt == None
            )
            if not user:
                raise HTTPException(
                    status_code=404,
                    detail='Username Not Found'
                )
                
            generate_otp = random.randint(100000 ,999999)
            expiry_time = int(time.time()) + (5*60)

            old_otp = await OTP.find(
                OTP.userId == str(user.id),
                OTP.type == type,
                OTP.isRevoked == False
            ).update({"$set" : {"isRevoked" : True}})

            otp = OTP(
                userId=str(user.id),
                otp=generate_otp,
                type=type,
                expireAt=expiry_time,
                attempts=5 
            )
            await otp.insert()
            replacements = {
                "name" : user.fname,
                "otp" : generate_otp,
                "expiry_minutes" : 5,
                "year" : datetime.now().year()
            }
            emailData = {
                "to" : user.email,
                "subject" : f"OTP Verification Code for {type}"
            }
            logger.info(f"Successfully created a otp")
            return replacements , emailData

        except HTTPException:
            raise
        except Exception as e:
            logger.error(f"Failed to Send Otp in DB : {str(e)}")
            raise

    @staticmethod
    async def verify_email(username : str , otp: str):
        try:
            user  = await User.find_one(
                User.username == username,
                User.deletedAt == None
            )

            if not user:
                raise HTTPException(
                    status_code=404,
                    detail="User Not Found"
                )

            otp_db = await OTP(
                OTP.userId == str(user.id),
                OTP.type == "email_verify",
                OTP.otp == otp,
                OTP.isRevoked == False
            )
            if int(otp_db.expireAt) < int(time.time()):
                otp_db.isRevoked = True
                await otp_db.save()
                raise HTTPException(
                    status_code=400,
                    detail="OTP Expired resend again"
                )
            
            if not otp_db:
                if otp_db.attempts > 0:
                    otp_db.attempts -= 1 
                    await otp_db.save()
                    raise HTTPException(
                        status_code= status.HTTP_400_BAD_REQUEST,
                        detail=f"Wrong OTP ...try again({otp_db.attempts})"
                    )
                else:
                    otp_db.isRevoked = True
                    await otp_db.save()
                    raise HTTPException(
                        status_code=status.HTTP_400_BAD_REQUEST,
                        detail=f"Wrong OTP...Resend again"
                    )
            otp_db.isRevoked = True,
            user.is_emailverified = True
            await otp_db.save()
            await user.save()
            logger.info("Successfully verify otp")
            return {
                "message" : "Email verify Successfully !!"
            }
        except HTTPException:
            raise
        except Exception as e:
            logger.error(f"Failed to Verify Otp in DB : {str(e)}")
            raise
    @staticmethod 
    async def get_user_by_id(userId : str):
        try:
            user = await User.find_one(
                User.id == PydanticObjectId(userId),
                User.deletedAt == None
            )

            if not user:
                raise HTTPException(
                    status_code=404,
                    detail="User not found"
                )
            logger.info(f'successfully fetch user by id')
            return user
        
        except HTTPException:
            raise
        except Exception as e :
            traceback.print_exc()
            logger.error(f"Failed to get user by id  :{ str(e)}")
            raise







            