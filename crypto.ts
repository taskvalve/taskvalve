import { Aes } from 'https://deno.land/x/crypto/aes.ts'
import { Cbc, Padding } from 'https://deno.land/x/crypto/block-modes.ts'
import * as base64 from 'https://deno.land/std@0.202.0/encoding/base64.ts'
import * as hex from 'https://deno.land/std@0.202.0/encoding/hex.ts'

export interface ICrypto {
    app: string
    encrypt(plaintext: string): Promise<{ iv: string, data: string, mac: string }>
    decrypt(data: string, mac: string): Promise<string>
    hmac(data: string): Promise<string>
}

export class DefaultCrypto implements ICrypto {
    private iv: string

    constructor(
        public app: string,
        private secret: string
    ) {
        this.iv = base64.encode(crypto.getRandomValues(new Uint8Array(16)))
    }

    async encrypt(plaintext: string): Promise<{ iv: string, data: string, mac: string }> {
        const encoder = new TextEncoder()
        const decoder = new TextDecoder()
        const key = await crypto.subtle.importKey('raw', base64.decode(this.secret), { name: 'HMAC', hash: 'SHA-256' }, true, ['sign', 'verify'])
        const encrypted = new Cbc(Aes, base64.decode(this.secret), base64.decode(this.iv), Padding.PKCS7).encrypt(encoder.encode(plaintext))
        const signature = await crypto.subtle.sign({ name: 'HMAC', hash: 'SHA-256' }, key, new Uint8Array([...encoder.encode(this.iv), ...encoder.encode(base64.encode(encrypted))]))
        const mac = hex.encode(new Uint8Array(signature))
        return {
            iv: this.iv,
            data: base64.encode(encrypted),
            mac: decoder.decode(mac)
        }
    }

    async decrypt(data: string, mac: string): Promise<string> {
        const encoder = new TextEncoder()
        const decoder = new TextDecoder()
        const key = await crypto.subtle.importKey('raw', base64.decode(this.secret), { name: 'HMAC', hash: 'SHA-256' }, true, ['sign', 'verify'])
        if (mac !== decoder.decode(hex.encode(new Uint8Array(await crypto.subtle.sign({ name: 'HMAC', hash: 'SHA-256' }, key, new Uint8Array([...encoder.encode(this.iv), ...encoder.encode(data)])))))) {
            throw new Error('Data integrity verification failed!')
        }
        const decrypted = new Cbc(Aes, base64.decode(this.secret), base64.decode(this.iv), Padding.PKCS7).decrypt(base64.decode(data))
        return decoder.decode(decrypted)
    }

    async hmac(data: string): Promise<string> {
        const encoder = new TextEncoder()
        const key = await crypto.subtle.importKey('raw', encoder.encode('base64:' + this.secret), { name: 'HMAC', hash: 'SHA-256' }, true, ['sign', 'verify'])
        return base64.encode(new Uint8Array(await crypto.subtle.sign({ name: 'HMAC', hash: 'SHA-256' }, key, encoder.encode(data))))
    }
}
