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
contract sFarming is Ownable {
    using SafeMath for uint256;
    using SafeERC20 for IERC20;

    // Info of each user.
    struct UserInfo {
        uint256 amount;     // How many sToken the user has provided.
        uint256 rewardDebt; // Reward debt. See explanation below.
    }

    // Info of each pool.
    struct PoolInfo {
        IERC20 sToken;           // Address of sToken contract.
        uint256 allocPoint;       // How many allocation points assigned to this pool. MILKs to distribute per block.
        uint256 lastRewardBlock;  // Last block number that MILKs distribution occurs.
        uint256 accMilkPerShare; // Accumulated MILKs per share, times 1e12. See below.
    }

    // The MILKIWAY_TOKEN!
    MilkyWayToken public milk;

    address public devAddr;

    address public distributor;

    uint256 public milkPerBlock; // 2

    uint256 public startFirstPhaseBlock;

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

    // Info of each user that stakes sToken.
    mapping (uint256 => mapping (address => UserInfo)) public userInfo;

    // Total allocation points. Must be the sum of all allocation points in all pools.
    uint256 public totalAllocPoint = 0;


    event Deposit(address indexed user, uint256 indexed pid, uint256 amount);
    event Withdraw(address indexed user, uint256 indexed pid, uint256 amount);
    event EmergencyWithdraw(address indexed user, uint256 indexed pid, uint256 amount);

    constructor(
        MilkyWayToken _milk,
        address _devAddr,
        address _distributor,
        uint256 _milkPerBlock, // 2000000000000000000
        uint256 _startFirstPhaseBlock // 0
    ) public {
        milk = _milk;
        devAddr = _devAddr;
        distributor = _distributor;
        milkPerBlock = _milkPerBlock;
        startFirstPhaseBlock = _startFirstPhaseBlock;
        startSecondPhaseBlock = startFirstPhaseBlock.add(10000);
        startThirdPhaseBlock = startSecondPhaseBlock.add(30000);
        bonusEndBlock = startThirdPhaseBlock.add(60000);
    }

    function poolLength() external view returns (uint256) {
        return poolInfo.length;
    }

    function add(uint256 _allocPoint, IERC20 _sToken, bool _withUpdate) public onlyOwner {
        if (_withUpdate) {
            massUpdatePools();
        }
        uint256 lastRewardBlock = block.number > startFirstPhaseBlock ? block.number : startFirstPhaseBlock;
        totalAllocPoint = totalAllocPoint.add(_allocPoint);
        poolInfo.push(PoolInfo({
        sToken: _sToken,
        allocPoint: _allocPoint,
        lastRewardBlock: lastRewardBlock,
        accMilkPerShare: 0
        }));
    }

    function set(uint256 _pid, uint256 _allocPoint, bool _withUpdate) public onlyOwner {
        if (_withUpdate) {
            massUpdatePools();
        }
        totalAllocPoint = totalAllocPoint.sub(poolInfo[_pid].allocPoint).add(_allocPoint);
        poolInfo[_pid].allocPoint = _allocPoint;
    }

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
            return bonusEndBlock.sub(_from).mul(BONUS_MULTIPLIER_1).add(
                _to.sub(bonusEndBlock)
            );
        }
    }

    function pendingMilk(uint256 _pid, address _user) external view returns (uint256) {
        PoolInfo storage pool = poolInfo[_pid];
        UserInfo storage user = userInfo[_pid][_user];
        uint256 accMilkPerShare = pool.accMilkPerShare;
        uint256 sSupply = pool.sToken.balanceOf(address(this));
        if (block.number > pool.lastRewardBlock && sSupply != 0) {
            uint256 multiplier = getMultiplier(pool.lastRewardBlock, block.number);
            uint256 milkReward = multiplier.mul(milkPerBlock).mul(pool.allocPoint).div(totalAllocPoint);
            accMilkPerShare = accMilkPerShare.add(milkReward.mul(1e12).div(sSupply));
        }
        return user.amount.mul(accMilkPerShare).div(1e12).sub(user.rewardDebt);
    }

    function massUpdatePools() public {
        uint256 length = poolInfo.length;
        for (uint256 pid = 0; pid < length; ++pid) {
            updatePool(pid);
        }
    }

    function updatePool(uint256 _pid) public {
        PoolInfo storage pool = poolInfo[_pid];
        if (block.number <= pool.lastRewardBlock) {
            return;
        }
        uint256 sSupply = pool.sToken.balanceOf(address(this));
        if (sSupply == 0) {
            pool.lastRewardBlock = block.number;
            return;
        }
        uint256 multiplier = getMultiplier(pool.lastRewardBlock, block.number);
        uint256 milkReward = multiplier.mul(milkPerBlock).mul(pool.allocPoint).div(totalAllocPoint);
        milk.mint(devAddr, milkReward.mul(3).div(100)); // 3% developers
        milk.mint(distributor, milkReward.div(100)); // 1% shakeHolders
        milk.mint(address(this), milkReward);
        pool.accMilkPerShare = pool.accMilkPerShare.add(milkReward.mul(1e12).div(sSupply));
        pool.lastRewardBlock = block.number;
    }

    function deposit(uint256 _pid, uint256 _amount) public {
        PoolInfo storage pool = poolInfo[_pid];
        UserInfo storage user = userInfo[_pid][msg.sender];
        updatePool(_pid);
        if (user.amount > 0) {
            uint256 pending = user.amount.mul(pool.accMilkPerShare).div(1e12).sub(user.rewardDebt);
            safeMilkTransfer(msg.sender, pending);
        }
        pool.sToken.safeTransferFrom(address(msg.sender), address(this), _amount);
        user.amount = user.amount.add(_amount);
        user.rewardDebt = user.amount.mul(pool.accMilkPerShare).div(1e12);
        emit Deposit(msg.sender, _pid, _amount);
    }

    function withdraw(uint256 _pid, uint256 _amount) public {
        PoolInfo storage pool = poolInfo[_pid];
        UserInfo storage user = userInfo[_pid][msg.sender];
        require(user.amount >= _amount, "withdraw: not good");
        updatePool(_pid);
        uint256 pending = user.amount.mul(pool.accMilkPerShare).div(1e12).sub(user.rewardDebt);
        safeMilkTransfer(msg.sender, pending);
        user.amount = user.amount.sub(_amount);
        user.rewardDebt = user.amount.mul(pool.accMilkPerShare).div(1e12);
        pool.sToken.safeTransfer(address(msg.sender), _amount);
        emit Withdraw(msg.sender, _pid, _amount);
    }

    function emergencyWithdraw(uint256 _pid) public {
        PoolInfo storage pool = poolInfo[_pid];
        UserInfo storage user = userInfo[_pid][msg.sender];
        pool.sToken.safeTransfer(address(msg.sender), user.amount);
        emit EmergencyWithdraw(msg.sender, _pid, user.amount);
        user.amount = 0;
        user.rewardDebt = 0;
    }

    function safeMilkTransfer(address _to, uint256 _amount) internal {
        uint256 milkBal = milk.balanceOf(address(this));
        if (_amount > milkBal) {
            milk.transfer(_to, milkBal);
        } else {
            milk.transfer(_to, _amount);
        }
    }

    function dev(address _devAddr) public {
        require(msg.sender == devAddr, "dev: wut?");
        devAddr = _devAddr;
    }

    function updateDistributor(address _distributor) public {
        require(msg.sender == devAddr, "dev: wut?");
        distributor = _distributor;
    }
}
