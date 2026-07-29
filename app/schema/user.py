from pydantic import BaseModel , EmailStr

class UserResponse(BaseModel):
    fname : str
    lname : str
    email : EmailStr
    is_active : bool
    is_emailverified : bool

class UserCreate(BaseModel):
    username : str
    first_name : str
    last_name : str 
    email : EmailStr 
    password : str

class UpdateUser(BaseModel):
    username : str
    fname : str
    lname : str 

class LoginSchema(BaseModel):
    username : str
    password : str
