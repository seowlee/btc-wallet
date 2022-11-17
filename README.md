# btc-wallet

### 개발환경
#### - 구현 
- Node.js - express
#### - 사용한 라이브러리
- bitcore-lib
- bitcore-mnemonic
#### - 비트코인 api
- Sochain (url : https://sochain.com/)
<br />

### Create HD wallet
1. 니모닉 생성 <br />
     POST /wallets/newMnemonic <br />
      ex) http://localhost:3000/wallets/newMnemonic <br />
      <img width="612" alt="image" src="https://user-images.githubusercontent.com/46402145/202334904-628b841b-6188-40bf-a0b0-1d2a9beecf38.png"> <br />
2. 니모닉 코드 -> 시드 -> xprv (Extended Private Key) 확장 개인 키 생성<br />
    <span style="color:green">GET</span> /wallets/mnemonicID/:mnemonicID<br />
     ex) http://localhost:3000/wallets/mnemonicID/1<br />
     <img width="612" alt="image" src="https://user-images.githubusercontent.com/46402145/202343788-acbd1442-1ec0-4922-8976-d96730098dd7.png"> <br />
3. 확장 개인키로 부터 파생된 childKey 생성 <br />
     POST /wallets/newHDWallet?mnemonicID=3&index=1 <br />
     ex) http://localhost:3000/wallets/newHDWallet?mnemonicID=3&index=1 <br />
<img width="612" alt="image" src="https://user-images.githubusercontent.com/46402145/202343853-5dbd3e37-d535-4a6a-858b-47fba4d0dd4f.png"> <br />
<br />

### Send Transaction
1. 잔액조회
     GET /tx/getUtxo?address=mi2gagrZhvx517zq28AXhd7nh4bo3MCHdQ <br />
      ex) http://localhost:3000/tx/getUtxo?address=mi2gagrZhvx517zq28AXhd7nh4bo3MCHdQ <br />
<img width="612" alt="image" src="https://user-images.githubusercontent.com/46402145/202344539-f3befa77-058b-4dba-bc65-6d9c006b4581.png"> <br />
2. Send Bitcoin <br />
     POST /tx/sendBitcoin <br />
     ex) http://localhost:3000/tx/sendBitcoin <br />
                   Body: <br />
	 { <br />
	      "privateKey": "a75e4e137d703cc088ca955dcb5a47befa0ae48dd538ddf38761f9ea5a455d62", <br />
	      "sourceAddress": "mi2gagrZhvx517zq28AXhd7nh4bo3MCHdQ", <br />
	      "recieverAddress":"mrNhNkKcGnZb7UP2ZoYPCDCPeqa344fEgE", <br />
	      "amountToSend": 0.00022 <br />
	 } <br />
<img width="612" alt="image" src="https://user-images.githubusercontent.com/46402145/202344813-496ee5cc-13a8-4c79-b81f-2a33f2519572.png"> <br />
<img width="612" alt="image" src="https://user-images.githubusercontent.com/46402145/202344840-59a7ed8d-7e39-4e7d-b071-ab0a64a89e55.png">


<br />
