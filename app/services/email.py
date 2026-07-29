import smtplib
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText
from app.config.logger import logger
from pathlib import Path

from jinja2 import Environment , FileSystemLoader

from app.config.settings import settings

CURRENT_DIR = Path(__file__).resolve().parent.parent
TEMPLATE_PATH = CURRENT_DIR / "templates"


jinja_env = Environment(loader=FileSystemLoader(TEMPLATE_PATH))

async def Mail( emailData : dict , replacements : dict , htmlFileName : str = None) -> str:
    try :
        if not htmlFileName:
            htmlFileName="email-template.html"

        template = jinja_env.get_template(htmlFileName)
        htmlsend = template.render(replacements)

        msg = MIMEMultipart('alternative')
        msg["Subject"] = emailData.get("subject")
        msg["To"] = emailData.get("to")

        default_from = f"{getattr(settings , 'mail_from_name' , 'CRM System')} <{settings.mail_from}>"
        msg["From"] = emailData.get("from") or default_from

        msg.attach(MIMEText(htmlsend , "html"))
        print("SMTP_HOST:", settings.SMTP_HOST)
        print("SMTP_PORT:", settings.SMTP_PORT)
        
        if int(settings.SMTP_PORT) == 465:
            with smtplib.SMTP_SSL(settings.SMTP_HOST, settings.SMTP_PORT) as server:
                server.login(settings.SMTP_EMAIL, settings.SMTP_PASSWORD)
                server.sendmail(settings.mail_from, [emailData.get("to")], msg.as_string())
        else:
            with smtplib.SMTP(settings.SMTP_HOST, settings.SMTP_PORT) as server:
                server.starttls()
                server.login(settings.SMTP_EMAIL, settings.SMTP_PASSWORD)
                server.sendmail(settings.mail_from, [emailData.get("to")], msg.as_string())

        logger.info("Email sent Successfully")
        return "Email sent !"
    except Exception as e :
        print(e)
        logger.error({
            "type": "Mail-error",
            "status": False,
            "error": str(e)
        })
        raise e