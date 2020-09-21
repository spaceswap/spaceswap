pragma solidity 0.6.12;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/SafeERC20.sol";
import "@openzeppelin/contracts/utils/EnumerableSet.sol";
import "@openzeppelin/contracts/math/SafeMath.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "./MilkyWayToken.sol";

// Interstellar is the master of Milk. He can make Milk and he is a fair guy.
//
// Note that it's ownable and the owner wields tremendous power. The ownership
// will be transferred to a governance smart contract once Milk is sufficiently
// distributed and the community can show to govern itself.
//
// Have fun reading it. Hopefully it's bug-free. God bless.
contract Interstellar is Ownable {
    using SafeMath for uint256;
    using SafeERC20 for IERC20;

    // Info of each user.
    struct UserInfo {
        uint256 amount;     // How many LP tokens the user has provided.
        uint256 rewardDebt; // Reward debt. See explanation below.
        //
        // We do some fancy math here. Basically, any point in time, the amount of Milks
        // entitled to a user but is pending to be distributed is:
        //
        //   pending reward = (user.amount * pool.accMilkPerShare) - user.rewardDebt
        //
        // Whenever a user deposits or withdraws LP tokens to a pool. Here's what happens:
        //   1. The pool's `accMilkPerShare` (and `lastRewardBlock`) gets updated.
        //   2. User receives the pending reward sent to his/her address.
        //   3. User's `amount` gets updated.
        //   4. User's `rewardDebt` gets updated.
    }

    // Info of each pool.
    struct PoolInfo {
        IERC20 lpToken;           // Address of LP token contract.
        uint256 allocPoint;       // How many allocation points assigned to this pool. MILKs to distribute per block.
        uint256 lastRewardBlock;  // Last block number that MILKs distribution occurs.
        uint256 accMilkPerShare; // Accumulated MILKs per share, times 1e12. See below.
    }

    // The MILKIWAY_TOKEN!
    MilkyWayToken public milk;

    // Dev address.
    address public devAddr;

    // MILK tokens created per block.
    uint256 public milkPerBlock; // 2

    // The block number when MILK mining starts.
    uint256 public startFirstPhaseBlock;

    // The block number when MILK mining starts.
    uint256 public startSecondPhaseBlock;

    // The block number when MILK mining starts.
    uint256 public startThirdPhaseBlock;

    // Block number when bonus MILK period ends.
    uint256 public bonusEndBlock;

    // Bonus multiplier for early milk makers.
    uint256 public constant BONUS_MULTIPLIER_1 = 20; // first 10,000 blocks

    uint256 public constant BONUS_MULTIPLIER_2 = 10; // next 30,000 blocks

    uint256 public constant BONUS_MULTIPLIER_3 = 5; // last 60,000 blocks

    // Info of each pool.
    PoolInfo[] public poolInfo;

    // Info of each user that stakes LP tokens.
    mapping (uint256 => mapping (address => UserInfo)) public userInfo;

    // Total allocation points. Must be the sum of all allocation points in all pools.
    uint256 public totalAllocPoint = 0;


    event Deposit(address indexed user, uint256 indexed pid, uint256 amount);
    event Withdraw(address indexed user, uint256 indexed pid, uint256 amount);
    event EmergencyWithdraw(address indexed user, uint256 indexed pid, uint256 amount);

    constructor(
        MilkyWayToken _milk,
        address _devAddr,
        uint256 _milkPerBlock, // 2000000000000000000
        uint256 _startFirstPhaseBlock // 0
    ) public {
        milk = _milk;
        devAddr = _devAddr;
        milkPerBlock = _milkPerBlock;
        startFirstPhaseBlock = _startFirstPhaseBlock;
        startSecondPhaseBlock = startFirstPhaseBlock.add(10000);
        startThirdPhaseBlock = startSecondPhaseBlock.add(30000);
        bonusEndBlock = startThirdPhaseBlock.add(60000);
    }

    function poolLength() external view returns (uint256) {
        return poolInfo.length;
    }

    // Add a new lp to the pool. Can only be called by the owner.
    // XXX DO NOT add the same LP token more than once. Rewards will be messed up if you do.
    function add(uint256 _allocPoint, IERC20 _lpToken, bool _withUpdate) public onlyOwner {
        if (_withUpdate) {
            massUpdatePools();
        }
        uint256 lastRewardBlock = block.number > startFirstPhaseBlock ? block.number : startFirstPhaseBlock;
        totalAllocPoint = totalAllocPoint.add(_allocPoint);
        poolInfo.push(PoolInfo({
        lpToken: _lpToken,
        allocPoint: _allocPoint,
        lastRewardBlock: lastRewardBlock,
        accMilkPerShare: 0
        }));
    }

    // Update the given pool's MILK allocation point. Can only be called by the owner.
    function set(uint256 _pid, uint256 _allocPoint, bool _withUpdate) public onlyOwner {
        if (_withUpdate) {
            massUpdatePools();
        }
        totalAllocPoint = totalAllocPoint.sub(poolInfo[_pid].allocPoint).add(_allocPoint);
        poolInfo[_pid].allocPoint = _allocPoint;
    }


    // Return reward multiplier over the given _from to _to block.
    function getMultiplier(uint256 _from, uint256 _to) public view returns (uint256) {
        if (_to <= startFirstPhaseBlock) { // 0
            return  _to.sub(_from); // x1
        }
        else if (_to <= startSecondPhaseBlock) { // + 10,000 blocks
            return _to.sub(_from).mul(BONUS_MULTIPLIER_1); // x20
        }
        else if (_to <= startThirdPhaseBlock) { // + 40,000 blocks
            return _to.sub(_from).mul(BONUS_MULTIPLIER_2); //x10
        }
        else if (_to <= bonusEndBlock) { // + 40,000 blocks
            return _to.sub(_from).mul(BONUS_MULTIPLIER_3); // x5
        }
        else if (_from >= bonusEndBlock) { // + 100,000 blocks
            return _to.sub(_from);
        }
        else {
            return bonusEndBlock.sub(_from).mul(BONUS_MULTIPLIER_1).add( // todo ????
                _to.sub(bonusEndBlock)
            );
        }
    }

    // View function to see pending MILKs on frontend.
    function pendingMilk(uint256 _pid, address _user) external view returns (uint256) {
        PoolInfo storage pool = poolInfo[_pid];
        UserInfo storage user = userInfo[_pid][_user];
        uint256 accMilkPerShare = pool.accMilkPerShare;
        uint256 lpSupply = pool.lpToken.balanceOf(address(this));
        if (block.number > pool.lastRewardBlock && lpSupply != 0) {
            uint256 multiplier = getMultiplier(pool.lastRewardBlock, block.number);
            uint256 milkReward = multiplier.mul(milkPerBlock).mul(pool.allocPoint).div(totalAllocPoint);
            accMilkPerShare = accMilkPerShare.add(milkReward.mul(1e12).div(lpSupply));
        }
        return user.amount.mul(accMilkPerShare).div(1e12).sub(user.rewardDebt);
    }

    // Update reward variables for all pools. Be careful of gas spending!
    function massUpdatePools() public {
        uint256 length = poolInfo.length;
        for (uint256 pid = 0; pid < length; ++pid) {
            updatePool(pid);
        }
    }

    // Update reward variables of the given pool to be up-to-date.
    function updatePool(uint256 _pid) public {
        PoolInfo storage pool = poolInfo[_pid];
        if (block.number <= pool.lastRewardBlock) {
            return;
        }
        uint256 lpSupply = pool.lpToken.balanceOf(address(this));
        if (lpSupply == 0) {
            pool.lastRewardBlock = block.number;
            return;
        }
        uint256 multiplier = getMultiplier(pool.lastRewardBlock, block.number);
        uint256 milkReward = multiplier.mul(milkPerBlock).mul(pool.allocPoint).div(totalAllocPoint);
        milk.mint(devAddr, milkReward.mul(3).div(100)); // todo
        milk.mint(address(this), milkReward);
        pool.accMilkPerShare = pool.accMilkPerShare.add(milkReward.mul(1e12).div(lpSupply));
        pool.lastRewardBlock = block.number;
    }

    // Deposit LP tokens to Interstellar for MILK allocation.
    function deposit(uint256 _pid, uint256 _amount) public {
        PoolInfo storage pool = poolInfo[_pid];
        UserInfo storage user = userInfo[_pid][msg.sender];
        updatePool(_pid);
        if (user.amount > 0) {
            uint256 pending = user.amount.mul(pool.accMilkPerShare).div(1e12).sub(user.rewardDebt);
            safeMilkTransfer(msg.sender, pending);
        }
        pool.lpToken.safeTransferFrom(address(msg.sender), address(this), _amount);
        user.amount = user.amount.add(_amount);
        user.rewardDebt = user.amount.mul(pool.accMilkPerShare).div(1e12);
        emit Deposit(msg.sender, _pid, _amount);
    }

    // Withdraw LP tokens from Interstellar.
    function withdraw(uint256 _pid, uint256 _amount) public {
        PoolInfo storage pool = poolInfo[_pid];
        UserInfo storage user = userInfo[_pid][msg.sender];
        require(user.amount >= _amount, "withdraw: not good");
        updatePool(_pid);
        uint256 pending = user.amount.mul(pool.accMilkPerShare).div(1e12).sub(user.rewardDebt);
        safeMilkTransfer(msg.sender, pending);
        user.amount = user.amount.sub(_amount);
        user.rewardDebt = user.amount.mul(pool.accMilkPerShare).div(1e12);
        pool.lpToken.safeTransfer(address(msg.sender), _amount);
        emit Withdraw(msg.sender, _pid, _amount);
    }

    // Withdraw without caring about rewards. EMERGENCY ONLY.
    function emergencyWithdraw(uint256 _pid) public {
        PoolInfo storage pool = poolInfo[_pid];
        UserInfo storage user = userInfo[_pid][msg.sender];
        pool.lpToken.safeTransfer(address(msg.sender), user.amount);
        emit EmergencyWithdraw(msg.sender, _pid, user.amount);
        user.amount = 0;
        user.rewardDebt = 0;
    }

    // Safe milk transfer function, just in case if rounding error causes pool to not have enough MILKs.
    function safeMilkTransfer(address _to, uint256 _amount) internal {
        uint256 milkBal = milk.balanceOf(address(this));
        if (_amount > milkBal) {
            milk.transfer(_to, milkBal);
        } else {
            milk.transfer(_to, _amount);
        }
    }

    // Update dev address by the previous dev.
    function dev(address _devAddr) public {
        require(msg.sender == devAddr, "dev: wut?");
        devAddr = _devAddr;
    }
}