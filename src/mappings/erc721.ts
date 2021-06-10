import { Address, BigInt, ethereum } from "@graphprotocol/graph-ts";
import { BridgedNTFToken as BridgedNFTTokenContract } from "../../generated/ETHNFTTokenManager/BridgedNTFToken";
import {
  ERC721HmyManager,
  Minted,
  Burned,
} from "../../generated/ERC721HmyManager/ERC721HmyManager";
import { BridgedNFT, Manager, NFTMint, NFTBurn } from "../../generated/schema";
import {
  createManager,
  getUser,
  getWallet,
  getWalletDayData,
  ONE,
  ZERO,
} from "../helpers";

function getManager(address: Address): Manager {
  let manager = Manager.load(address.toHexString());

  if (manager === null) {
    let contract = ERC721HmyManager.bind(address);
    let wallet = getWallet(contract.wallet());
    manager = createManager(address, wallet);
  }

  return manager as Manager;
}

function createERC721Token(
  address: Address,
  manager: Manager,
  event: ethereum.Event
): BridgedNFT {
  let instance = BridgedNFTTokenContract.bind(address);

  let name = instance.try_name();
  let symbol = instance.try_symbol();

  let token = new BridgedNFT(address.toHexString());
  token.network = "ETHEREUM";
  token.address = address;
  token.manager = manager.id;

  token.name = name.reverted ? "unknow" : name.value;
  token.symbol = symbol.reverted ? "unknow" : symbol.value;

  token.inventory = new Array<BigInt>();

  token.eventsCount = ZERO;
  token.mintsCount = ZERO;
  token.burnsCount = ZERO;

  token.manager = manager.id;
  token.save();

  let wallet = getWallet(Address.fromString(manager.wallet));
  wallet.assetsCount = wallet.assetsCount.plus(ONE);
  wallet.save();

  let walletDayData = getWalletDayData(wallet, event);
  walletDayData.assetsCount = wallet.assetsCount;
  walletDayData.newAssetsCount = walletDayData.newAssetsCount.plus(ONE);
  walletDayData.save();

  return token;
}

function getToken(
  address: Address,
  manager: Manager,
  event: ethereum.Event
): BridgedNFT {
  let token = BridgedNFT.load(address.toHexString());

  if (token === null) {
    return createERC721Token(address, manager, event);
  }

  // if (token.manager === null || token.manager !== manager.id) {
  //   token.manager = manager.id;
  //   token.save();

  //   let wallet = getWallet(Address.fromString(manager.wallet));
  //   wallet.assetsCount = wallet.assetsCount.plus(ONE);
  //   wallet.save();

  //   let walletDayData = getWalletDayData(wallet, event);
  //   walletDayData.newAssetsCount = walletDayData.newAssetsCount.plus(ONE);
  //   walletDayData.save();
  // }

  return token as BridgedNFT;
}

export function handleMinted(event: Minted): void {
  let manager = getManager(event.address);
  let wallet = getWallet(Address.fromString(manager.wallet));
  let user = getUser(event.params.recipient, wallet, event);
  let token = getToken(event.params.oneToken, manager, event);
  let mint = new NFTMint(
    event.transaction.hash
      .toHexString()
      .concat("-")
      .concat(event.logIndex.toString())
  );
  mint.contract = event.address;
  mint.type = "NFT_MINT";
  mint.token = token.id;
  mint.manager = manager.id;
  mint.asset = token.id;
  mint.user = user.id;
  mint.tokenId = event.params.tokenId;
  mint.recipient = event.params.recipient;
  mint.receiptId = event.params.receiptId;
  mint.timestamp = event.block.timestamp;
  mint.blockNumber = event.block.number;
  mint.txIndex = event.transaction.index;
  mint.txHash = event.transaction.hash;
  mint.save();

  token.eventsCount = token.eventsCount.plus(ONE);
  token.mintsCount = token.mintsCount.plus(ONE);

  token.inventory = token.inventory.concat([event.params.tokenId]);
  token.save();

  manager.eventsCount = manager.eventsCount.plus(ONE);
  manager.nftMintsCount = manager.nftMintsCount.plus(ONE);
  manager.save();

  user.eventsCount = user.eventsCount.plus(ONE);
  user.nftMintsCount = user.nftMintsCount.plus(ONE);
  user.save();
}

type TokenFilter = (value: BigInt, index: i32, array: BigInt[]) => boolean;

function createTokenFilter(tokenId: BigInt): TokenFilter {
  return (value: BigInt, index: i32, array: BigInt[]) => {
    return tokenId.notEqual(value);
  };
}

export function handleBurned(event: Burned): void {
  let manager = getManager(event.address);
  let wallet = getWallet(Address.fromString(manager.wallet));
  let user = getUser(event.params.recipient, wallet, event);
  let token = getToken(event.params.token, manager, event);
  let burn = new NFTBurn(
    event.transaction.hash
      .toHexString()
      .concat("-")
      .concat(event.logIndex.toString())
  );
  burn.contract = event.address;
  burn.type = "NFT_BURN";
  burn.asset = token.id;
  burn.token = token.id;
  burn.manager = manager.id;
  burn.user = user.id;
  burn.tokenId = event.params.tokenId;
  burn.recipient = event.params.recipient;
  burn.sender = event.params.sender;
  burn.timestamp = event.block.timestamp;
  burn.blockNumber = event.block.number;
  burn.txIndex = event.transaction.index;
  burn.txHash = event.transaction.hash;
  burn.save();

  token.eventsCount = token.eventsCount.plus(ONE);
  token.burnsCount = token.burnsCount.plus(ONE);

  token.inventory = token.inventory.filter(
    createTokenFilter(event.params.tokenId)
  );

  token.save();

  manager.eventsCount = manager.eventsCount.plus(ONE);
  manager.nftMintsCount = manager.nftMintsCount.plus(ONE);
  manager.save();

  user.eventsCount = user.eventsCount.plus(ONE);
  user.nftMintsCount = user.nftMintsCount.plus(ONE);
  user.save();
}
