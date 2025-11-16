//go:build js && wasm

package main

import (
	"crypto/ed25519"
	"crypto/x509"

	"github.com/btcsuite/btcutil/base58"
	"github.com/tyler-smith/go-bip32"
	"github.com/tyler-smith/go-bip39"

	"encoding/base64"
	"encoding/json"

	"syscall/js"
)

type Ed25519Box struct {
	Mnemonic  string   `json:"mnemonic"`
	Bip44Path []uint32 `json:"bip44Path"`
	Pub       string   `json:"pub"`
	Prv       string   `json:"prv"`
}

func generateEd25519Keypair(this js.Value, args []js.Value) interface{} {

	mnemonic := args[0].String()

	mnemonicPassword := args[1].String()

	// Now get the bip44DerivePath

	bip44DerivePath := []uint32{uint32(args[2].Int()), uint32(args[3].Int()), uint32(args[4].Int()), uint32(args[5].Int())}

	if mnemonic == "" {

		// Generate mnemonic if no pre-set

		entropy, _ := bip39.NewEntropy(256)

		mnemonic, _ = bip39.NewMnemonic(entropy)

	}

	// Now generate seed from 24-word mnemonic phrase (24 words = 256 bit security)
	// Seed has 64 bytes
	seed := bip39.NewSeed(mnemonic, mnemonicPassword) // password might be ""(empty) but it's not recommended

	// Generate master keypair from seed

	masterPrivateKey, _ := bip32.NewMasterKey(seed)

	// Now, to derive appropriate keypair - run the cycle over uint32 path-milestones and derive child keypairs

	// In case bip44Path empty - set the default one

	if len(bip44DerivePath) == 0 {

		bip44DerivePath = []uint32{44, 7337, 0, 0}

	}

	// Start derivation from master private key
	var childKey *bip32.Key = masterPrivateKey

	for _, pathPart := range bip44DerivePath {
		childKey, _ = childKey.NewChildKey(bip32.FirstHardenedChild + pathPart)
	}

	// Now, based on this - get the appropriate keypair

	publicKeyObject, privateKeyObject := generateKeyPairFromSeed(childKey.Key)

	// Export keypair

	pubKeyBytes, _ := x509.MarshalPKIXPublicKey(publicKeyObject)

	privKeyBytes, _ := x509.MarshalPKCS8PrivateKey(privateKeyObject)

	ed25519Box := Ed25519Box{Mnemonic: mnemonic, Bip44Path: bip44DerivePath, Pub: base58.Encode(pubKeyBytes[12:]), Prv: base64.StdEncoding.EncodeToString(privKeyBytes)}

	jsonData, _ := json.Marshal(ed25519Box)

	return string(jsonData)

}

// Private inner function

func generateKeyPairFromSeed(seed []byte) (ed25519.PublicKey, ed25519.PrivateKey) {

	privateKey := ed25519.NewKeyFromSeed(seed)

	pubKey, _ := privateKey.Public().(ed25519.PublicKey)

	return pubKey, privateKey

}

func main() {

	js.Global().Set("generateEd25519Keypair", js.FuncOf(generateEd25519Keypair))

	<-make(chan bool)

}
