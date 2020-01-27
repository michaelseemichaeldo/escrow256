 	<!-- A document called avoiding_common_attacks.md that explains what measures you took to ensure that your contracts are not susceptible to common attacks. (Module 9 Lesson 3) -->
# Reentrancy and Constantinople Reentrancy Attack




# Front-Running (AKA Transaction-Ordering Dependence)





# Integer Overflow and Underflow¶

If a balance reaches the maximum uint value (2^256) it will circle back to zero which checks for the condition. This may or may not be relevant, depending on the implementation. Think about whether or not the uint value has an opportunity to approach such a large number. Think about how the uint variable changes state, and who has authority to make such changes. If any user can call functions which update the uint value, it's more vulnerable to attack. If only an admin has access to change the variable's state, you might be safe. If a user can increment by only 1 at a time, you are probably also safe because there is no feasible way to reach this limit.

The same is true for underflow. If a uint is made to be less than zero, it will cause an underflow and get set to its maximum value.

Be careful with the smaller data-types like uint8, uint16, uint24...etc: they can even more easily hit their maximum value.

Warning: Be aware there are around 20 cases for overflow and underflow.

One simple solution to mitigate the common mistakes for overflow and underflow is to use SafeMath.sol library for arithmetic functions.




# Denial of Service with Failed Call (SWC-113)
Another potential danger of passing execution to another contract is a denial of service attack (SWC-113). 





# Forcibly Sending Ether to a Contract¶
It is possible to forcibly send Ether to a contract without triggering its fallback function. This is an important consideration when placing important logic in the fallback function or making calculations based on a contract's balance. Take the following example:

contract Vulnerable {
    function () payable {
        revert();
    }

    function somethingBad() {
        require(this.balance > 0);
        // Do something bad
    }
}
Contract logic seems to disallow payments to the contract and therefore disallow "something bad" from happening. However, a few methods exist for forcibly sending ether to the contract and therefore making its balance greater than zero.

The selfdestruct contract method allows a user to specify a beneficiary to send any excess ether. selfdestruct does not trigger a contract's fallback function.