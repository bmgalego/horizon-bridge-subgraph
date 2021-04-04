import { Returned } from "../../generated/Deposit/Deposit";
import { Withdraw } from "../../generated/schema";

export function handleReturned(event: Returned): void {
  let withdraw = new Withdraw(
    event.transaction.hash
      .toHexString()
      .concat("-")
      .concat(event.logIndex.toString())
  );

  withdraw.type = "WITHDRAW";
  withdraw.timestamp = event.block.timestamp;
  withdraw.blockNumber = event.block.number;
  withdraw.txIndex = event.transaction.index;
  withdraw.txHash = event.transaction.hash;

  withdraw.recipient = event.params.recipient.toHexString();
  withdraw.amount = event.params.amount;
  withdraw.save();
}
