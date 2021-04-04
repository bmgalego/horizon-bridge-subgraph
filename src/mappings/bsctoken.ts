import { Address, BigInt } from "@graphprotocol/graph-ts";
import { BridgedToken as BridgedTokenContract } from "../../generated/BSCTokenManager/BridgedToken";
import { TokenMapAck } from "../../generated/BSCTokenManager/TokenManager";
import { BridgedToken } from "../../generated/schema";
import { ZERO } from "../helpers";

function createBEP20Token(address: Address): BridgedToken {
  let instance = BridgedTokenContract.bind(address);

  let name = instance.try_name();
  let symbol = instance.try_symbol();
  let decimals = instance.try_decimals();

  let token = new BridgedToken(address.toHexString());
  token.network = "BINANCE";
  token.address = address;
  token.name = name.reverted ? "unknow" : name.value;
  token.symbol = symbol.reverted ? "unknow" : symbol.value;
  token.decimals = decimals.reverted
    ? BigInt.fromI32(0)
    : BigInt.fromI32(decimals.value);

  token.eventsCount = ZERO;
  token.mintsCount = ZERO;
  token.burnsCount = ZERO;
  token.totalLocked = ZERO;

  token.save();

  return token;
}

function getToken(address: Address): BridgedToken {
  let token = BridgedToken.load(address.toHexString());

  if (token === null) {
    return createBEP20Token(address);
  }

  return token as BridgedToken;
}

export function handleTokenMapAck(event: TokenMapAck): void {
  let token = getToken(event.params.tokenAck);
  token.mappedAddress = event.params.tokenReq;
  token.save();
}
