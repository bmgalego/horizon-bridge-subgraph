import { Address, BigInt } from "@graphprotocol/graph-ts";
import { LinkTokenInterface } from "../../generated/LINKHmyManager/LinkTokenInterface";
import {
  LINKHmyManager,
  Minted,
  Burned,
} from "../../generated/LINKHmyManager/LINKHmyManager";
import { Mint, Burn, BridgedToken, Manager } from "../../generated/schema";
import { createManager, getUser, getWallet, ONE, ZERO } from "../helpers";

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

  let token = new BridgedToken(address.toHexString());
  token.network = "HARMONY";
  token.address = address;
  token.manager = manager.id;

  token.name = name.reverted ? "unknow" : name.value;
  token.symbol = symbol.reverted ? "unknow" : symbol.value;
  token.decimals = decimals.reverted
    ? BigInt.fromI32(18)
    : BigInt.fromI32(decimals.value);

  token.eventsCount = ZERO;
  token.mintsCount = ZERO;
  token.burnsCount = ZERO;
  token.totalLocked = ZERO;

  token.save();

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
  let user = getUser(event.params.recipient);
  let manager = getManager(event.address);
  let token = getToken(event.params.oneToken, manager);
  let mint = new Mint(
    event.transaction.hash
      .toHexString()
      .concat("-")
      .concat(event.logIndex.toString())
  );
  mint.type = "MINT";
  mint.token = token.id;
  mint.manager = manager.id;
  mint.asset = token.id;
  mint.user = user.id;
  mint.amount = event.params.amount;
  mint.recipient = event.params.recipient;
  mint.receiptId = event.params.receiptId;
  mint.timestamp = event.block.timestamp;
  mint.blockNumber = event.block.number;
  mint.txIndex = event.transaction.index;
  mint.txHash = event.transaction.hash;
  mint.save();

  token.eventsCount = token.eventsCount.plus(ONE);
  token.mintsCount = token.mintsCount.plus(ONE);
  token.totalLocked = token.totalLocked.plus(event.params.amount);
  token.save();

  manager.eventsCount = manager.eventsCount.plus(ONE);
  manager.mintsCount = manager.mintsCount.plus(ONE);
  manager.save();

  user.eventsCount = user.eventsCount.plus(ONE);
  user.mintsCount = user.mintsCount.plus(ONE);
  user.save();
}

export function handleBurned(event: Burned): void {
  let user = getUser(event.params.recipient);
  let manager = getManager(event.address);
  let token = getToken(event.params.token, manager);
  let burn = new Burn(
    event.transaction.hash
      .toHexString()
      .concat("-")
      .concat(event.logIndex.toString())
  );
  burn.type = "BURN";
  burn.asset = token.id;
  burn.token = token.id;
  burn.manager = manager.id;
  burn.user = user.id;
  burn.amount = event.params.amount;
  burn.recipient = event.params.recipient;
  burn.sender = event.params.sender;
  burn.timestamp = event.block.timestamp;
  burn.blockNumber = event.block.number;
  burn.txIndex = event.transaction.index;
  burn.txHash = event.transaction.hash;
  burn.save();

  token.eventsCount = token.eventsCount.plus(ONE);
  token.burnsCount = token.burnsCount.plus(ONE);
  token.totalLocked = token.totalLocked.minus(event.params.amount);
  token.save();

  manager.eventsCount = manager.eventsCount.plus(ONE);
  manager.mintsCount = manager.mintsCount.plus(ONE);
  manager.save();

  user.eventsCount = user.eventsCount.plus(ONE);
  user.mintsCount = user.mintsCount.plus(ONE);
  user.save();
}
