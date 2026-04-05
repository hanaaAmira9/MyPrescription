import speakeasy from "speakeasy";
import qrcode from "qrcode";

export const generateTOTPSecret = (email: string) => {
    const secret = speakeasy.generateSecret({
        name: `MyPrescription (${email})`,
    });
    
    return { 
        secret: secret.base32, 
        otpauthUrl: secret.otpauth_url || ""
    };
};


export const generateQRCode = async (otpauthUrl: string): Promise<string> => {
    try {
        return await qrcode.toDataURL(otpauthUrl);
    } catch (error) {
        console.error("Erreur lors de la génération du QR Code :", error);
        throw new Error("Impossible de générer le QR Code.");
    }
};


export const verifyTOTPToken = (token: string, secret: string): boolean => {
    try {
        return speakeasy.totp.verify({
            secret: secret,
            encoding: 'base32',
            token: token,
            window: 1 
        });
    } catch (error) {
        console.error("Erreur de vérification TOTP :", error);
        return false;
    }
};
