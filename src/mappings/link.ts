import { Address, BigInt } from "@graphprotocol/graph-ts";
import { LinkTokenInterface } from "../../generated/LINKHmyManager/LinkTokenInterface";
import {
  LINKHmyManager,
  Minted,
  Burned,
} from "../../generated/LINKHmyManager/LINKHmyManager";
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
    let contract = LINKHmyManager.bind(address);
    let wallet = getWallet(contract.wallet());
    manager = createManager(address, wallet);
  }

  return manager as Manager;
}

function createLINKToken(address: Address, manager: Manager): BridgedToken {
  let instance = LinkTokenInterface.bind(address);

  let name = instance.try_name();
  let symbol = instance.try_symbol();
  let decimals = instance.try_decimals();

  let token = createBridgedToken(
    address,
    "HARMONY",
    name.reverted ? "LINK" : name.value,
    symbol.reverted ? "LINK" : symbol.value,
    decimals.reverted ? ZERO : BigInt.fromI32(decimals.value)
  );

  return token;
}

function getToken(address: Address, manager: Manager): BridgedToken {
  let token = BridgedToken.load(address.toHexString());

  if (token === null) {
    return createLINKToken(address, manager);
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
