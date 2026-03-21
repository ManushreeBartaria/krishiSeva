from datetime import datetime, timedelta, timezone
from jose import jwt, JWTError
from passlib.context import CryptContext

# -------------------------------
# CONFIG
# -------------------------------
SECRET_KEY = "hackathon-secret-key"
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 60

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")


# -------------------------------
# PASSWORD HASHING
# -------------------------------
def hash_password(password: str) -> str:
    if not password:
        raise ValueError("Password cannot be empty")

    # bcrypt limit fix
    password = password[:72]

    return pwd_context.hash(password)


def verify_password(plain: str, hashed: str) -> bool:
    if not plain or not hashed:
        return False

    return pwd_context.verify(plain[:72], hashed)


# -------------------------------
# TOKEN CREATION
# -------------------------------
def create_access_token(data: dict) -> str:
    to_encode = data.copy()

    expire = datetime.now(timezone.utc) + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)

    to_encode.update({"exp": expire})

    return jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)


# -------------------------------
# TOKEN VERIFICATION
# -------------------------------
def verify_access_token(token: str):
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        return payload

    except JWTError:
        return None