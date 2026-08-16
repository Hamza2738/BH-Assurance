from flask_mail import Message
from flask_jwt_extended import create_access_token
from datetime import timedelta
from extension import mail

def send_account_creation_email(to_email, user_email, password):
    try:

        token = create_access_token(identity=user_email, expires_delta=timedelta(minutes=30))
        reset_link = f"http://localhost:4200/authentication/resetpassword?token={token}"


        html_content = f"""
        <!DOCTYPE html>
        <html lang="fr">
        <head><meta charset="UTF-8"><title>Bienvenue chez BH Assurance</title></head>
        <body style="background-color:#f4f4f4; font-family: Arial, sans-serif;">
            <div style="max-width:700px; margin:auto; background:white; padding:20px; border-radius:8px;">
                
                <h1 style="color:#ff4e45;">Bienvenue chez <strong>BH ASSURANCE</strong></h1>
                <p>Votre compte a été créé avec succès.</p>
                <h2>Identifiants :</h2>
                <p><strong>Email :</strong> {user_email}</p>
                <p><strong>Mot de passe :</strong> {password}</p>
                <p style="color: #d9534f;"><strong>⚠️ Veuillez changer votre mot de passe dès la première connexion.</strong></p>
                <a href="{reset_link}" style="display:inline-block; margin-top:20px; background-color:#ff4e45; color:white; padding:12px 24px; text-decoration:none; border-radius:4px;">Changer mon mot de passe</a>
                <hr style="margin:40px 0;">
                <h2 style="color:#24232b;">Besoin d’aide ?</h2>
                <p>Notre équipe est à votre écoute.</p>
                <a href="mailto:gestioncongebh@gmail.com" style="display:inline-block; margin-top:10px; background-color:#ff4e45; color:white; padding:10px 20px; text-decoration:none; border-radius:4px;">Contactez-nous</a>
            </div>
        </body>
        </html>
        """

        msg = Message(subject="🎉 Bienvenue chez BH Assurance !", recipients=[to_email], html=html_content)
        mail.send(msg)
        print(f"✅ Email envoyé à {to_email}")
    except Exception as e:
        print(f"❌ Erreur envoi email à {to_email} : {e}")
