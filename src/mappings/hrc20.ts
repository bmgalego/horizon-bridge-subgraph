import { Address, BigInt, ethereum } from "@graphprotocol/graph-ts";
import {
  Locked,
  Unlocked,
  HRC20HmyManager,
} from "../../generated/HRC20HmyManager/HRC20HmyManager";
import { HRC20 } from "../../generated/HRC20HmyManager/HRC20";
import { Token, Manager, BridgedToken } from "../../generated/schema";
import {
  createManager,
  createToken,
  createTokenLock,
  createTokenUnlock,
  getWallet,
  getWalletDayData,
  ONE,
  ZERO,
} from "../helpers";

let ONE_TOKEN = Address.fromHexString(
  "0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee"
);

function getManager(address: Address): Manager {
  let manager = Manager.load(address.toHexString());

  if (manager === null) {
    let contract = HRC20HmyManager.bind(address);
    let wallet = getWallet(contract.wallet());
    manager = createManager(address, wallet);
  }

  return manager as Manager;
}

function createHRC20Token(
  address: Address,
  manager: Manager,
  event: ethereum.Event
): Token {
  let instance = HRC20.bind(address);

  let name = instance.try_name();
  let symbol = instance.try_symbol();
  let decimals = instance.try_decimals();

  let token = createToken(
    address,
    "HARMONY",
    name.reverted ? "unknow" : name.value,
    symbol.reverted ? "unknow" : symbol.value,
    decimals.reverted ? ZERO : BigInt.fromI32(decimals.value)
  );

  let wallet = getWallet(Address.fromString(manager.wallet));
  wallet.assetsCount = wallet.assetsCount.plus(ONE);
  wallet.save();

  let walletDayData = getWalletDayData(wallet, event);
  walletDayData.newAssetsCount = walletDayData.newAssetsCount.plus(ONE);
  walletDayData.save();

  return token;
}

function createONEToken(
  address: Address,
  manager: Manager,
  event: ethereum.Event
): Token {
  let token = createToken(
    address,
    "HARMONY",
    "HarmonyOne",
    "ONE",
    BigInt.fromI32(18)
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
): Token {
  let token = Token.load(address.toHexString());

  if (token === null) {
    return ONE_TOKEN.equals(address)
      ? createONEToken(address, manager, event)
      : createHRC20Token(address, manager, event);
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

  return token as Token;
}

export function handleLocked(event: Locked): void {
  if (BridgedToken.load(event.params.token.toHexString())) {
    // bridged tokens cant lock or unlock
    // this happens when sending bridged tokens to this manager
    return;
  }
  let manager = getManager(event.address);
  let token = getToken(event.params.token, manager, event);
  createTokenLock(token, manager, event);
}

export function handleUnlocked(event: Unlocked): void {
  if (BridgedToken.load(event.params.hmyToken.toHexString())) {
    // bridged tokens cant lock or unlock
    // this happens when sending bridged tokens to this manager
    return;
  }
  let manager = getManager(event.address);
  let token = getToken(event.params.hmyToken, manager, event);
  createTokenUnlock(token, manager, event);
}
