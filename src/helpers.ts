import { Address, BigInt } from "@graphprotocol/graph-ts";
import { Manager, User, Wallet } from "../generated/schema";

export let ZERO = BigInt.fromI32(0);
export let ONE = BigInt.fromI32(1);

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
