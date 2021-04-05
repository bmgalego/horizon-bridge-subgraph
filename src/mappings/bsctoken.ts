import { Address, BigInt } from "@graphprotocol/graph-ts";
import { BridgedToken as BridgedTokenContract } from "../../generated/BSCTokenManager/BridgedToken";
import { TokenMapAck } from "../../generated/BSCTokenManager/TokenManager";
import { BridgedToken } from "../../generated/schema";
import { createBridgedToken, ZERO } from "../helpers";

function createBEP20Token(address: Address): BridgedToken {
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
