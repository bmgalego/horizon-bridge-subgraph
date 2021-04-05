import { Bytes, Address, BigInt, ethereum } from "@graphprotocol/graph-ts";
import {
  BridgedToken,
  Burn,
  Lock,
  Manager,
  Mint,
  Token,
  Unlock,
  User,
  Wallet,
} from "../generated/schema";

export let ZERO = BigInt.fromI32(0);
export let ONE = BigInt.fromI32(1);

export function createToken(
  address: Address,
  network: string,
  name: string,
  symbol: string,
  decimals: BigInt
): Token {
  let token = new Token(address.toHexString());
  token.network = network;
  token.address = address;

  token.name = name;
  token.symbol = symbol;
  token.decimals = decimals;

  token.eventsCount = ZERO;
  token.locksCount = ZERO;
  token.unlocksCount = ZERO;
  token.totalLocked = ZERO;
  token.save();

  return token;
}

export function createBridgedToken(
  address: Address,
  network: string,
  name: string,
  symbol: string,
  decimals: BigInt
): BridgedToken {
  let token = new BridgedToken(address.toHexString());
  token.network = network;
  token.address = address;

  token.name = name;
  token.symbol = symbol;
  token.decimals = decimals;

  token.eventsCount = ZERO;
  token.mintsCount = ZERO;
  token.burnsCount = ZERO;
  token.totalLocked = ZERO;

  token.save();

  return token;
}

export function createManager(address: Address, wallet: Wallet): Manager {
  let manager = new Manager(address.toHexString());

  manager.wallet = wallet.id;
  manager.eventsCount = ZERO;

  manager.locksCount = ZERO;
  manager.unlocksCount = ZERO;

  manager.mintsCount = ZERO;
  manager.burnsCount = ZERO;

  manager.nftMintsCount = ZERO;
  manager.nftBurnsCount = ZERO;
  manager.save();

  return manager;
}

export function getWallet(address: Address): Wallet {
  let wallet = Wallet.load(address.toHexString());
  if (wallet === null) {
    wallet = new Wallet(address.toHexString());
    wallet.transactionsCount = ZERO;
    wallet.transactionsConfirmedCount = ZERO;
    wallet.transactionsExecutedCount = ZERO;
    wallet.save();
  }

  return wallet as Wallet;
}

export function getUser(address: Address): User {
  let user = User.load(address.toHexString());

  if (user === null) {
    user = new User(address.toHexString());
    user.eventsCount = ZERO;

    user.locksCount = ZERO;
    user.unlocksCount = ZERO;

    user.mintsCount = ZERO;
    user.burnsCount = ZERO;

    user.nftMintsCount = ZERO;
    user.nftBurnsCount = ZERO;

    user.save();
  }

  return user as User;
}

interface ILockedParams {
  token: Address;
  sender: Address;
  amount: BigInt;
  recipient: Address;
}

interface ILocked extends ethereum.Event {
  params: ILockedParams;
}

interface IUnlockedParams {
  amount: BigInt;
  recipient: Address;
  receiptId: Bytes;
}

interface IUnlocked extends ethereum.Event {
  params: IUnlockedParams;
}

interface IMintedParams {
  amount: BigInt;
  recipient: Address;
  receiptId: Bytes;
}

interface IMinted extends ethereum.Event {
  params: IMintedParams;
}

interface IBurnedParams {
  token: Address;
  sender: Address;
  amount: BigInt;
  recipient: Address;
}

interface IBurned extends ethereum.Event {
  params: IBurnedParams;
}

export function createTokenMint<T extends IMinted>(
  token: BridgedToken,
  manager: Manager,
  event: T
): void {
  let user = getUser(event.params.recipient);
  let mint = new Mint(
    event.transaction.hash
      .toHexString()
      .concat("-")
      .concat(event.logIndex.toString())
  );
  mint.contract = event.address;
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

export function createTokenBurn<T extends IBurned>(
  token: BridgedToken,
  manager: Manager,
  event: T
): void {
  let user = getUser(event.params.recipient);

  let burn = new Burn(
    event.transaction.hash
      .toHexString()
      .concat("-")
      .concat(event.logIndex.toString())
  );
  burn.contract = event.address;
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

export function createTokenLock<T extends ILocked>(
  token: Token,
  manager: Manager,
  event: T
): void {
  let user = getUser(event.params.recipient);
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

export function createTokenUnlock<T extends IUnlocked>(
  token: Token,
  manager: Manager,
  event: T
): void {
  let user = getUser(event.params.recipient);
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
