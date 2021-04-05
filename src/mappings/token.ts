import { Address, BigInt } from "@graphprotocol/graph-ts";
import { BridgedToken as BridgedTokenContract } from "../../generated/ETHTokenManager/BridgedToken";
import { BridgedNTFToken as BridgedNFTContract } from "../../generated/ETHNFTTokenManager/BridgedNTFToken";
import { TokenMapAck } from "../../generated/ETHTokenManager/TokenManager";
import { TokenMapAck as NFTTokenMapAck } from "../../generated/ETHNFTTokenManager/NFTTokenManager";
import { BridgedToken, BridgedNFT } from "../../generated/schema";
import { createBridgedToken, ZERO } from "../helpers";

export function createERC20Token(address: Address): BridgedToken {
  let instance = BridgedTokenContract.bind(address);

  let name = instance.try_name();
  let symbol = instance.try_symbol();
  let decimals = instance.try_decimals();

  let token = createBridgedToken(
    address,
    "ETHEREUM",
    name.reverted ? "unknow" : name.value,
    symbol.reverted ? "unknow" : symbol.value,
    decimals.reverted ? ZERO : BigInt.fromI32(decimals.value)
  );

  return token;
}

export function createERC721Token(address: Address): BridgedNFT {
  let instance = BridgedNFTContract.bind(address);

  let name = instance.try_name();
  let symbol = instance.try_symbol();

  let token = new BridgedNFT(address.toHexString());
  token.network = "ETHEREUM";
  token.address = address;
  token.name = name.reverted ? "unknow" : name.value;
  token.symbol = symbol.reverted ? "unknow" : symbol.value;

  token.inventory = new Array<BigInt>();

  token.eventsCount = ZERO;
  token.mintsCount = ZERO;
  token.burnsCount = ZERO;

  token.save();

  return token;
}

function getToken(address: Address): BridgedToken {
  let token = BridgedToken.load(address.toHexString());

  if (token === null) {
    return createERC20Token(address);
  }

  return token as BridgedToken;
}

function getNFTToken(address: Address): BridgedNFT {
  let token = BridgedNFT.load(address.toHexString());

  if (token === null) {
    return createERC721Token(address);
  }

  return token as BridgedNFT;
}

export function handleTokenMapAck(event: TokenMapAck): void {
  let token = getToken(event.params.tokenAck);
  token.mappedAddress = event.params.tokenReq;
  token.save();
}

export function handleNFTTokenMapAck(event: NFTTokenMapAck): void {
  let token = getNFTToken(event.params.tokenAck);
  token.mappedAddress = event.params.tokenReq;
  token.save();
}
