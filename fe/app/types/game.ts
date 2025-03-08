export interface Game {
  account: {
    data: {
      authority: string;
      bump: number;
      name: string;
      native_token: string;
      nft_collection: string;
      symbol: string;
      uri: string;
    };
    lamports: number;
    owner: string;
    pubkey: string;
  };
  status: string;
} 