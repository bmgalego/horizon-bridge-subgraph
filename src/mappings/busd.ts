import { Address, BigInt } from "@graphprotocol/graph-ts";
import { BUSD } from "../../generated/BUSDHmyManager/BUSD";
import {
  BUSDHmyManager,
  Minted,
  Burned,
} from "../../generated/BUSDHmyManager/BUSDHmyManager";
import { BridgedToken, Manager } from "../../generated/schema";
import {
  createBridgedToken,
  createManager,
  createTokenBurn,
  createTokenMint,
  getWallet,
  ZERO,
} from "../helpers";

function getManager(address: Address): Manager {
  let manager = Manager.load(address.toHexString());

  if (manager === null) {
    let contract = BUSDHmyManager.bind(address);
    let wallet = getWallet(contract.wallet());
    manager = createManager(address, wallet);
  }

  return manager as Manager;
}

function createBUSDToken(address: Address, manager: Manager): BridgedToken {
  let instance = BUSD.bind(address);

  let name = instance.try_name();
  let symbol = instance.try_symbol();
  let decimals = instance.try_decimals();

  let token = createBridgedToken(
    address,
    "HARMONY",
    name.reverted ? "BUSD" : name.value,
    symbol.reverted ? "BUSD" : symbol.value,
    decimals.reverted ? ZERO : BigInt.fromI32(decimals.value)
  );

  return token;
}

function getToken(address: Address, manager: Manager): BridgedToken {
  let token = BridgedToken.load(address.toHexString());

  if (token === null) {
    return createBUSDToken(address, manager);
  }

  if (token.manager === null || token.manager !== manager.id) {
    token.manager = manager.id;
    token.save();
  }

  return token as BridgedToken;
}

export function handleMinted(event: Minted): void {
  let manager = getManager(event.address);
  let token = getToken(event.params.oneToken, manager);
  createTokenMint(token, manager, event);
}

export function handleBurned(event: Burned): void {
  let manager = getManager(event.address);
  let token = getToken(event.params.token, manager);
  createTokenBurn(token, manager, event);
}
