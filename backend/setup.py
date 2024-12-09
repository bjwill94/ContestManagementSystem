from setuptools import setup, find_packages

setup(
    name="judgify",
    version="0.1",
    packages=find_packages(),
    install_requires=[
        "fastapi",
        "uvicorn",
        "sqlalchemy",
        "pydantic",
        "python-dotenv",
        "alembic",
        "psycopg2-binary",
        "python-multipart",
        "python-jose[cryptography]",
        "passlib[bcrypt]",
        "fastapi-cors",
    ],
)
