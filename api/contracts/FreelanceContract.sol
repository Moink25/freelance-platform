// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

/**
 * @title FreelanceContract
 * @dev Contract for managing freelance project agreements between clients and freelancers
 */
contract FreelanceContract {
    address public client;
    address public freelancer;
    uint256 public amount;
    uint256 public createdAt;
    uint256 public deliveryDate;
    string public terms;

    enum Status {
        Created,
        Active,
        Completed,
        Cancelled,
        Disputed
    }
    Status public status;

    event ContractCreated(
        address indexed client,
        address indexed freelancer,
        uint256 amount
    );
    event ContractActivated(uint256 timestamp);
    event ContractCompleted(uint256 timestamp);
    event ContractCancelled(uint256 timestamp, string reason);
    event DisputeRaised(address initiator, string reason);

    modifier onlyClient() {
        require(msg.sender == client, "Only the client can call this function");
        _;
    }

    modifier onlyFreelancer() {
        require(
            msg.sender == freelancer,
            "Only the freelancer can call this function"
        );
        _;
    }

    modifier inState(Status _status) {
        require(status == _status, "Invalid contract state for this operation");
        _;
    }

    /**
     * @dev Create a new freelance contract
     * @param _freelancer Address of the freelancer
     * @param _deliveryDate Expected delivery date (unix timestamp)
     * @param _terms Project terms and conditions
     */
    constructor(
        address _freelancer,
        uint256 _deliveryDate,
        string memory _terms
    ) payable {
        require(msg.value > 0, "Contract amount must be greater than zero");
        require(_freelancer != address(0), "Invalid freelancer address");
        require(
            _deliveryDate > block.timestamp,
            "Delivery date must be in the future"
        );

        client = msg.sender;
        freelancer = _freelancer;
        amount = msg.value;
        createdAt = block.timestamp;
        deliveryDate = _deliveryDate;
        terms = _terms;
        status = Status.Created;

        emit ContractCreated(client, freelancer, amount);
    }

    /**
     * @dev Activate the contract (can only be called by the freelancer)
     */
    function activateContract()
        external
        onlyFreelancer
        inState(Status.Created)
    {
        status = Status.Active;
        emit ContractActivated(block.timestamp);
    }

    /**
     * @dev Complete the contract and release funds (can only be called by the client)
     */
    function completeContract() external onlyClient inState(Status.Active) {
        status = Status.Completed;
        // Transfer funds to the freelancer
        (bool success, ) = freelancer.call{value: amount}("");
        require(success, "Transfer failed");
        emit ContractCompleted(block.timestamp);
    }

    /**
     * @dev Cancel the contract (can only be called by the client)
     */
    function cancelContract(string memory reason) external onlyClient {
        require(
            status == Status.Created || status == Status.Active,
            "Contract cannot be cancelled in current state"
        );
        status = Status.Cancelled;
        // Refund funds to the client
        (bool success, ) = client.call{value: address(this).balance}("");
        require(success, "Transfer failed");
        emit ContractCancelled(block.timestamp, reason);
    }

    /**
     * @dev Raise a dispute on the contract
     */
    function raiseDispute(string memory reason) external {
        require(
            msg.sender == client || msg.sender == freelancer,
            "Only contract parties can raise disputes"
        );
        require(
            status == Status.Active,
            "Disputes can only be raised on active contracts"
        );
        status = Status.Disputed;
        emit DisputeRaised(msg.sender, reason);
    }

    /**
     * @dev Get contract details
     */
    function getContractDetails()
        external
        view
        returns (
            address _client,
            address _freelancer,
            uint256 _amount,
            uint256 _createdAt,
            uint256 _deliveryDate,
            string memory _terms,
            Status _status
        )
    {
        return (
            client,
            freelancer,
            amount,
            createdAt,
            deliveryDate,
            terms,
            status
        );
    }
}
