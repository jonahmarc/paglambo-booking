from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

    database_url: str
    secret_key: str
    debug: bool = False
    cors_origins: list[str] = ["http://localhost:5173"]
    resend_api_key: str = ""
    resend_from_email: str = ""
    resend_test_to: str = ""  # Redirect all emails here while in Resend sandbox (no verified domain)
    platform_email: str = "hello@paglamboBooking.com"  # Inbox for contact form submissions
    access_token_expire_minutes: int = 30
    refresh_token_expire_days: int = 30
    upload_dir: str = "uploads"


settings = Settings()
