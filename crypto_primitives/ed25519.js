import '../addons/wasm_exec.js'
import Base58 from 'base-58'
import crypto from 'crypto'


export default {


    generateDefaultEd25519Keypair:async(mnemonic,mnemoPass,bip44Path)=>{

        let ed25519Box = globalThis.generateEd25519Keypair(mnemonic,mnemoPass,...bip44Path)

        return ed25519Box
    
    },

    
    signEd25519:(data,privateKeyAsBase64)=>{

        const privateKeyPem = `-----BEGIN PRIVATE KEY-----\n${privateKeyAsBase64}\n-----END PRIVATE KEY-----`

        return crypto.sign(null, Buffer.from(data), privateKeyPem).toString('base64')

    },

        

    verifyEd25519:(data,signature,pubKey)=>{

        return new Promise((resolve, reject) => {

            // Decode public key from Base58 and encode to hex , add  
    
            let pubInHex = Buffer.from(Base58.decode(pubKey)).toString('hex')
    
            // Now add ASN.1 prefix
    
            let pubWithAsnPrefix = '302a300506032b6570032100'+pubInHex
    
            // Encode to Base64
    
            let pubAsBase64 = Buffer.from(pubWithAsnPrefix,'hex').toString('base64')
    
            // Finally, add required prefix and postfix
    
            let finalPubKey = `-----BEGIN PUBLIC KEY-----\n${pubAsBase64}\n-----END PUBLIC KEY-----`
    
            crypto.verify(null, data, finalPubKey, Buffer.from(signature, 'base64'), (err, isVerified) => 
    
                err ? reject(false) : resolve(isVerified)
    
            )
    
    
        }).catch(() => false)

    }


}