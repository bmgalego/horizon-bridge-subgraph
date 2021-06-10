import { Address, BigInt, ethereum } from "@graphprotocol/graph-ts";
import { BridgedToken as BridgedTokenContract } from "../../generated/ETHTokenManager/BridgedToken";
import {
  ERC20HmyManager,
  Minted,
  Burned,
} from "../../generated/BEP20HmyManager/ERC20HmyManager";
import { BridgedToken, Manager } from "../../generated/schema";
import {
  createBridgedToken,
  createManager,
  createTokenBurn,
  createTokenMint,
  getWallet,
  getWalletDayData,
  ONE,
  ZERO,
} from "../helpers";

function getManager(address: Address): Manager {
  let manager = Manager.load(address.toHexString());

  if (manager === null) {
    let contract = ERC20HmyManager.bind(address);
    let wallet = getWallet(contract.wallet());
    manager = createManager(address, wallet);
  }

  return manager as Manager;
}

function createBEP20Token(
  address: Address,
  manager: Manager,
  event: ethereum.Event
): BridgedToken {
  let instance = BridgedTokenContract.bind(address);

  let name = instance.try_name();
  let symbol = instance.try_symbol();
  let decimals = instance.try_decimals();

  let token = createBridgedToken(
    address,
    "BINANCE",
    name.reverted ? "unknow" : name.value,
    symbol.reverted ? "unknow" : symbol.value,
    decimals.reverted ? ZERO : BigInt.fromI32(decimals.value)
  );

  // token.manager = manager.id;
  // token.save();

  // let wallet = getWallet(Address.fromString(manager.wallet));
  // wallet.assetsCount = wallet.assetsCount.plus(ONE);
  // wallet.save();

  // let walletDayData = getWalletDayData(wallet, event);
  // walletDayData.newAssetsCount = walletDayData.newAssetsCount.plus(ONE);
  // walletDayData.save();

  return token;
}

function getToken(
  address: Address,
  manager: Manager,
  event: ethereum.Event
): BridgedToken {
  let token = BridgedToken.load(address.toHexString());

  if (token === null) {
    return createBEP20Token(address, manager, event);
  }

  if (token.manager === null) {
    token.manager = manager.id;
    token.save();

    let wallet = getWallet(Address.fromString(manager.wallet));
    wallet.assetsCount = wallet.assetsCount.plus(ONE);
    wallet.save();

    let walletDayData = getWalletDayData(wallet, event);
    walletDayData.assetsCount = wallet.assetsCount;
    walletDayData.newAssetsCount = walletDayData.newAssetsCount.plus(ONE);
    walletDayData.save();
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

  return token as BridgedToken;
}

export function handleMinted(event: Minted): void {
  let manager = getManager(event.address);
  let token = getToken(event.params.oneToken, manager, event);
  createTokenMint(token, manager, event);
}

export function handleBurned(event: Burned): void {
  let manager = getManager(event.address);
  let token = getToken(event.params.token, manager, event);
  createTokenBurn(token, manager, event);
}
