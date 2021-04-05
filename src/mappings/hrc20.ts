import { Address, BigInt } from "@graphprotocol/graph-ts";
import {
  Locked,
  Unlocked,
  HRC20HmyManager,
} from "../../generated/HRC20HmyManager/HRC20HmyManager";

import { HRC20 } from "../../generated/HRC20HmyManager/HRC20";
import {
  Lock,
  Unlock,
  Token,
  Manager,
  BridgedToken,
} from "../../generated/schema";
import { createManager, getUser, getWallet, ONE, ZERO } from "../helpers";

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

function createHRC20Token(address: Address, manager: Manager): Token {
  let instance = HRC20.bind(address);

  let name = instance.try_name();
  let symbol = instance.try_symbol();
  let decimals = instance.try_decimals();

  let token = new Token(address.toHexString());
  token.network = "HARMONY";
  token.address = address;

  token.manager = manager.id;
  token.name = name.reverted ? "unknow" : name.value;
  token.symbol = symbol.reverted ? "unknow" : symbol.value;
  token.decimals = decimals.reverted
    ? BigInt.fromI32(0)
    : BigInt.fromI32(decimals.value);

  token.eventsCount = ZERO;
  token.locksCount = ZERO;
  token.unlocksCount = ZERO;
  token.totalLocked = ZERO;

  token.save();

  return token;
}

function createONEToken(address: Address, manager: Manager): Token {
  let token = new Token(address.toHexString());
  token.network = "HARMONY";
  token.address = address;

  token.manager = manager.id;
  token.name = "HarmonyOne";
  token.symbol = "ONE";
  token.decimals = BigInt.fromI32(18);

  token.eventsCount = ZERO;
  token.locksCount = ZERO;
  token.unlocksCount = ZERO;
  token.totalLocked = ZERO;

  token.save();

  return token;
}

function getToken(address: Address, manager: Manager): Token {
  let token = Token.load(address.toHexString());

  if (token === null) {
    return ONE_TOKEN.equals(address)
      ? createONEToken(address, manager)
      : createHRC20Token(address, manager);
  }

  if (token.manager === null || token.manager !== manager.id) {
    token.manager = manager.id;
    token.save();
  }

  return token as Token;
}

export function handleLocked(event: Locked): void {
  if (BridgedToken.load(event.params.token.toHexString())) {
    return;
  }
  let user = getUser(event.params.recipient);

  let manager = getManager(event.address);
  let token = getToken(event.params.token, manager);
  let lock = new Lock(
    event.transaction.hash
      .toHexString()
      .concat("-")
      .concat(event.logIndex.toString())
  );
  lock.contract = event.address;
  lock.type = "LOCK";
  lock.asset = token.id;
  lock.token = token.id;
  lock.manager = manager.id;
  lock.user = user.id;
  lock.amount = event.params.amount;
  lock.recipient = event.params.recipient;
  lock.sender = event.params.sender;
  lock.timestamp = event.block.timestamp;
  lock.blockNumber = event.block.number;
  lock.txIndex = event.transaction.index;
  lock.txHash = event.transaction.hash;
  lock.save();

  token.eventsCount = token.eventsCount.plus(ONE);
  token.locksCount = token.locksCount.plus(ONE);
  token.totalLocked = token.totalLocked.plus(event.params.amount);
  token.save();

  manager.eventsCount = manager.eventsCount.plus(ONE);
  manager.locksCount = manager.locksCount.plus(ONE);
  manager.save();

  user.eventsCount = user.eventsCount.plus(ONE);
  user.locksCount = user.locksCount.plus(ONE);
  user.save();
}

export function handleUnlocked(event: Unlocked): void {
  if (BridgedToken.load(event.params.hmyToken.toHexString())) {
    return;
  }
  let user = getUser(event.params.recipient);

  let manager = getManager(event.address);
  let token = getToken(event.params.hmyToken, manager);
  let unlock = new Unlock(
    event.transaction.hash
      .toHexString()
      .concat("-")
      .concat(event.logIndex.toString())
  );
  unlock.contract = event.address;
  unlock.type = "UNLOCK";
  unlock.asset = token.id;
  unlock.token = token.id;
  unlock.manager = manager.id;
  unlock.user = user.id;
  unlock.amount = event.params.amount;
  unlock.recipient = event.params.recipient;
  unlock.receiptId = event.params.receiptId;
  unlock.timestamp = event.block.timestamp;
  unlock.blockNumber = event.block.number;
  unlock.txIndex = event.transaction.index;
  unlock.txHash = event.transaction.hash;
  unlock.save();

  token.eventsCount = token.eventsCount.plus(ONE);
  token.unlocksCount = token.unlocksCount.plus(ONE);
  token.totalLocked = token.totalLocked.minus(event.params.amount);
  token.save();

  manager.eventsCount = manager.eventsCount.plus(ONE);
  manager.unlocksCount = manager.unlocksCount.plus(ONE);
  manager.save();

  user.eventsCount = user.eventsCount.plus(ONE);
  user.unlocksCount = user.unlocksCount.plus(ONE);
  user.save();
}
