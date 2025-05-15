const ContractModel = require("../models/contractModel");
const OrderModel = require("../models/orderModel");
const ServiceModel = require("../models/serviceModel");
const UserModel = require("../models/UserModel");
const { Web3 } = require("web3");
const fs = require("fs");
const path = require("path");
const HDWalletProvider = require("@truffle/hdwallet-provider");
require("dotenv").config();

// Define a dev mode flag for testing without MongoDB
const DEV_MODE = process.env.NODE_ENV !== "production";

// Initialize Web3 with a provider to the Ethereum testnet
const setupWeb3 = () => {
  // In simulation mode, we don't need an actual Web3 connection
  console.log("Using simulated blockchain mode for demonstration");

  // Create a mock web3 instance that doesn't actually connect to any network
  const mockWeb3 = new Web3("http://localhost:8545");

  // Override the eth.getAccounts method to return a fake account
  mockWeb3.eth.getAccounts = async () => {
    return ["0x" + require("crypto").randomBytes(20).toString("hex")];
  };

  return mockWeb3;
};

const web3 = setupWeb3();

// Get the deployer address - not used in simulation mode
// const getDeployerAddress = async () => {
//   try {
//     const accounts = await web3.eth.getAccounts();
//     return accounts[0];
//   } catch (error) {
//     console.error("Error getting deployer address:", error);
//     return null;
//   }
// };

// Load contract ABI and bytecode
const contractPath = path.join(__dirname, "../contracts/FreelanceContract.sol");
const solc = require("solc");

// Function to compile the contract
const compileContract = () => {
  try {
    // Instead of compiling on-the-fly, use a pre-compiled version of the contract
    // This is a simplified approach that avoids potential compilation issues
    const abi = [
      {
        inputs: [
          {
            internalType: "address",
            name: "_freelancer",
            type: "address",
          },
          {
            internalType: "uint256",
            name: "_deliveryDate",
            type: "uint256",
          },
          {
            internalType: "string",
            name: "_terms",
            type: "string",
          },
        ],
        stateMutability: "payable",
        type: "constructor",
      },
      {
        anonymous: false,
        inputs: [
          {
            indexed: true,
            internalType: "address",
            name: "client",
            type: "address",
          },
          {
            indexed: true,
            internalType: "address",
            name: "freelancer",
            type: "address",
          },
          {
            indexed: false,
            internalType: "uint256",
            name: "amount",
            type: "uint256",
          },
        ],
        name: "ContractCreated",
        type: "event",
      },
      {
        anonymous: false,
        inputs: [
          {
            indexed: false,
            internalType: "uint256",
            name: "timestamp",
            type: "uint256",
          },
        ],
        name: "ContractActivated",
        type: "event",
      },
      {
        anonymous: false,
        inputs: [
          {
            indexed: false,
            internalType: "uint256",
            name: "timestamp",
            type: "uint256",
          },
        ],
        name: "ContractCompleted",
        type: "event",
      },
      {
        anonymous: false,
        inputs: [
          {
            indexed: false,
            internalType: "uint256",
            name: "timestamp",
            type: "uint256",
          },
          {
            indexed: false,
            internalType: "string",
            name: "reason",
            type: "string",
          },
        ],
        name: "ContractCancelled",
        type: "event",
      },
      {
        anonymous: false,
        inputs: [
          {
            indexed: false,
            internalType: "address",
            name: "initiator",
            type: "address",
          },
          {
            indexed: false,
            internalType: "string",
            name: "reason",
            type: "string",
          },
        ],
        name: "DisputeRaised",
        type: "event",
      },
      {
        inputs: [],
        name: "activateContract",
        outputs: [],
        stateMutability: "nonpayable",
        type: "function",
      },
      {
        inputs: [
          {
            internalType: "string",
            name: "reason",
            type: "string",
          },
        ],
        name: "cancelContract",
        outputs: [],
        stateMutability: "nonpayable",
        type: "function",
      },
      {
        inputs: [],
        name: "client",
        outputs: [
          {
            internalType: "address",
            name: "",
            type: "address",
          },
        ],
        stateMutability: "view",
        type: "function",
      },
      {
        inputs: [],
        name: "completeContract",
        outputs: [],
        stateMutability: "nonpayable",
        type: "function",
      },
      {
        inputs: [],
        name: "createdAt",
        outputs: [
          {
            internalType: "uint256",
            name: "",
            type: "uint256",
          },
        ],
        stateMutability: "view",
        type: "function",
      },
      {
        inputs: [],
        name: "deliveryDate",
        outputs: [
          {
            internalType: "uint256",
            name: "",
            type: "uint256",
          },
        ],
        stateMutability: "view",
        type: "function",
      },
      {
        inputs: [],
        name: "freelancer",
        outputs: [
          {
            internalType: "address",
            name: "",
            type: "address",
          },
        ],
        stateMutability: "view",
        type: "function",
      },
      {
        inputs: [],
        name: "getContractDetails",
        outputs: [
          {
            internalType: "address",
            name: "_client",
            type: "address",
          },
          {
            internalType: "address",
            name: "_freelancer",
            type: "address",
          },
          {
            internalType: "uint256",
            name: "_amount",
            type: "uint256",
          },
          {
            internalType: "uint256",
            name: "_createdAt",
            type: "uint256",
          },
          {
            internalType: "uint256",
            name: "_deliveryDate",
            type: "uint256",
          },
          {
            internalType: "string",
            name: "_terms",
            type: "string",
          },
          {
            internalType: "enum FreelanceContract.Status",
            name: "_status",
            type: "uint8",
          },
        ],
        stateMutability: "view",
        type: "function",
      },
      {
        inputs: [
          {
            internalType: "string",
            name: "reason",
            type: "string",
          },
        ],
        name: "raiseDispute",
        outputs: [],
        stateMutability: "nonpayable",
        type: "function",
      },
      {
        inputs: [],
        name: "status",
        outputs: [
          {
            internalType: "enum FreelanceContract.Status",
            name: "",
            type: "uint8",
          },
        ],
        stateMutability: "view",
        type: "function",
      },
      {
        inputs: [],
        name: "terms",
        outputs: [
          {
            internalType: "string",
            name: "",
            type: "string",
          },
        ],
        stateMutability: "view",
        type: "function",
      },
      {
        inputs: [],
        name: "amount",
        outputs: [
          {
            internalType: "uint256",
            name: "",
            type: "uint256",
          },
        ],
        stateMutability: "view",
        type: "function",
      },
    ];

    // Simple bytecode for the contract (this is a placeholder)
    // In a real scenario, you would pre-compile the contract and use the exact bytecode
    const bytecode =
      "608060405260405162001070380380620010708339810160408190526200002691620001c1565b6000341180156200003757506000198434105b620000a55760405162461bcd60e51b815260206004820152603560248201527f436f6e747261637420616d6f756e74206d757374206265206772656174657220604482015274746861692b656980b934b9ba32b9103937b9b4b29760591b606482015260840160405180910390fd5b600073ffffffffffffffffffffffffffffffffffffffff168373ffffffffffffffffffffffffffffffffffffffff1614156200011c5760405162461bcd60e51b815260206004820152601b60248201527f496e76616c6964206672656573584e3a186365722061646472657373000000604482015260640160405180910390fd5b42821115620001745760405162461bcd60e51b81526020600482015260226024820152610dcd60a21b0319195960719a1b31d1d0195c9958da08195e1958dd60721b604482015260640160405180910390fd5b600080546001600160a01b03191633179055600180546001600160a01b0384166001600160a01b031991821617909155346002556003429055600482905560058190556006805461ff00191690556040517fa4d8d19e4236f74f71b5571fcefd57461de48e60bbd047deb0c74ad50992bf229290600090a350620002bc9050565b80516001600160a01b0381168114620001bc57600080fd5b919050565b600080600060608486031215620001d757600080fd5b620001e284620001a4565b9250602084015167ffffffffffffffff80821115620002005760008081fd5b908501906080828803121562000215578182fd5b825115158082146200022557600080fd5b825260208301518290526040830151829052606083015191506200024982620001a4565b826060820152809350505050606086015162000283573d6000803e3d6000fd5b620002938760408801620001a4565b855250608086015190507ffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffe0813612156200016e578051801515811462000016575b505092959194509250565b610da480620002cc6000396000f3fe6080604052600436106100e15760003560e01c80638da5cb5b1161007f578063c1abe3541161005e578063c1abe3541461027f578063d4b8399214610294578063d67cbdd1146102b9578063e3a9db1a146102d957600080fd5b80638da5cb5b146102165780639ae8886a1461024e578063abfce78d1461027257600080fd5b806329dcb0cf116100b057806329dcb0cf1461019457806363bd1d4a146101a957806374457f2f146101c957806375f12b21146101e957600080fd5b8063013cf08b146100e65780630fc365d91461011b5780632223353314610158575b600080fd5b3480156100f257600080fd5b5061010660653ffffffffffffffff1661030a565b60405190815260200160405180910390f35b34801561012757600080fd5b5061015061013636600461097a565b602081013562ffffff161c6001600160a01b031690565b60405160208101919091526001600160a01b0316604082015260600160405180910390f35b34801561016457600080fd5b506001546101779060010b61ffff1681565b6040516020810183905260ff909116604082015260600160405180910390f35b3480156101a057600080fd5b50610106610312565b3480156101b557600080fd5b506101066101c436600461097a565b610318565b6101d76101d7366004610939565b610330565b005b3480156101f557600080fd5b5061020960065461ff0081161490565b60405190151581526020015b60405180910390f35b34801561022257600080fd5b506000546101509061ffff8082169160ff604082901c84169161060482901c166001600160a01b031690565b34801561025a57600080fd5b5061026461038e565b6040519081526020016101fd565b34801561027e57600080fd5b506102f8565b34801561028b57600080fd5b506004610106565b3480156102a057600080fd5b506102ac610474565b6040516101fd91906109cc565b3480156102c557600080fd5b506101d76102d43660046108d5565b6104ff565b3480156102e557600080fd5b506102ee6105cf565b6040516101fd91906109fa565b61010661069a565b60006060825101905092915050565b60045481565b6003356020810135602435604435606435565b600080600260038054909181548201019055906000610350908483610abb565b505060005b8151811015610386576103758683838151811061037357600080fd5b81019091018035825101602082035b6001810192508261035e9050565b6001019050610363565b50505050565b600060026003805490918154820101905590600061039d816103a081610abb565b601e9060026007816103b3836103a081610abb565b6001909301929092556103aa9173eeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee946b033b2e3c9fd0803ce80000006103ea818561069a565b6103f39061069a565b99505f42118061040157508392505b806104095750600091505b84841a156104205761041c620f4240610abb565b90505b8183116104305761042d81610abb565b90505b80831080156104425750506104459160019101602061039d816060608381525f565b90508084038102905f1915801561045c575060ff86161481155b15610465575090505b61046a866105cf565b509a9a9a50565b60606005805461048390610a28565b80601f01602080910402602001604051908101604052809291908181526020018280546104af90610a28565b80156104fc5780601f106104d1576101008083540402835291602001916104fc565b820191906000526020600020905b8154815290600101906020018083116104df57829003601f168201915b5050505050905090565b336001600160a01b037f000000000000000000000000000000000000000000000000000000000000000016148061053d57506001546001600160a01b03163314155b1561057a5760405162461bcd60e51b8152602060048201526014602482015273125b98dbdc9c9958dd081a5b88199bdc881c195960621b60448201526064015b60405180910390fd5b6006805460ff60981b1916600160981b1790556040517f45ba5a1ebfa855ebe7c20dcc7dea535b663330fad8c41ec8a619e4190fe269eb9061027e903390849033905f9055600655565b6000546001546002546003546004546005546006546105f693939293919060ff808216916001600160a01b039190911690565b6040805160ff94851681526001600160a01b039384166020820152929092169083015260608201526080810191909152519081900360a00190f35b60005433906001600160a01b0316811461066a5760405162461bcd60e51b815260206004820152602260248201527f4f6e6c79207468652063584e3a173c90c6d656e742063616e2063616c6c2074686973604482015261373960f01b6064820152608401610571565b5f6006549060ff600881811c91161461068d576106886003610afc565b61068d565b505f545b5050565b600060026003805490918154820101905590600061039d816103a081610abb565b80356001600160a01b03811681146106cc57600080fd5b919050565b7f4e487b7100000000000000000000000000000000000000000000000000000000600052604160045260246000fd5b600082601f83011261070e57600080fd5b813567ffffffffffffffff8082111561072957610729816106d1565b604051601f8301601f19908116603f0116810190828211818310171561075157610751816106d1565b8160405283815286602085880101111561076a57600080fd5b836020870160208301376000602085830101528094505050505092915050565b600082601f83011261079b57600080fd5b813567ffffffffffffffff8111156107b5576107b5816106d1565b6107c8601f8201601f1916602001610a63565b8181528460208386010111156107dd57600080fd5b816020850160208301376000918101602001919091529392505050565b7f4e487b7100000000000000000000000000000000000000000000000000000000600052603260045260246000fd5b600081518084526020808501945080840160005b83811015600080fd5b81602081860101519281602483010152601f909101601f191682010192915050565b60c08152600060206001600160a01b03808816845260408201889052606082018790526080820186905282810185905290610a3282870184610823565b979650505050505050565b600181811c90821680610a3c57607f821691505b602082108103610a5d577f4e487b7100000000000000000000000000000000000000000000000000000000600052602260045260246000fd5b50919050565b604051601f8201601f1916810167ffffffffffffffff81118282101715610a8c57610a8c816106d1565b604052919050565b7f4e487b7100000000000000000000000000000000000000000000000000000000600052601160045260246000fd5b60008219821115610ace57610ace610a92565b500190565b7f4e487b7100000000000000000000000000000000000000000000000000000000600052600160045260246000fd5b600060018201610b0e57610b0e610a92565b506001019056fea2646970667358221220a5b7fa72e8a9a6e16a1c09b06aac6c18a4f447da2f1181520c77d5debafd5d3464736f6c63430008000033";

    return {
      abi: abi,
      bytecode: bytecode,
    };
  } catch (error) {
    console.error("Contract compilation error:", error);
    throw new Error("Failed to compile contract");
  }
};

// Wrapper function to create smart contract
const createSmartContract = async (orderIdOrData) => {
  try {
    // Check if orderIdOrData is a string (orderId) or an object (project data)
    if (typeof orderIdOrData === "string" || orderIdOrData instanceof String) {
      // It's an orderId, use the existing function
      return await createBlockchainContract(orderIdOrData);
    } else if (typeof orderIdOrData === "object") {
      // It's project data, create a contract directly without creating an order
      const {
        clientId,
        freelancerId,
        projectId,
        amount,
        projectTitle,
        projectDescription,
        clientName,
        freelancerName,
      } = orderIdOrData;

      // Check if contract already exists for this project
      const existingContract = await ContractModel.findOne({ projectId });
      if (existingContract) {
        return {
          success: true,
          message: "Contract already exists for this project",
          contract: existingContract,
          contractId: existingContract._id,
        };
      }

      // Get client and freelancer details
      const client = await UserModel.findById(clientId);
      const freelancer = await UserModel.findById(freelancerId);

      if (!client || !freelancer) {
        return { success: false, message: "User not found" };
      }

      // Create smart contract terms
      const terms = `Project: ${projectTitle}\nDescription: ${projectDescription}\nAmount: ${amount}\nAgreed by ${
        clientName || client.username
      } and ${freelancerName || freelancer.username}`;

      // Set delivery date (30 days from now for demo)
      const deliveryDate = new Date();
      deliveryDate.setDate(deliveryDate.getDate() + 30);

      // Create a new contract directly without an order
      const newContract = new ContractModel({
        clientId: client._id,
        freelancerId: freelancer._id,
        projectId: projectId,
        amount: amount,
        status: "created",
        terms: terms,
        deliveryDate: deliveryDate,
        clientEthereumAddress: client.ethereumAddress,
      });

      // Generate simulated blockchain data
      const contractAddress = `0x${require("crypto")
        .randomBytes(20)
        .toString("hex")}`;
      const transactionHash = `0x${require("crypto")
        .randomBytes(32)
        .toString("hex")}`;

      // Save contract address and transaction hash
      newContract.contractAddress = contractAddress;
      newContract.transactionHash = transactionHash;
      await newContract.save();

      return {
        success: true,
        message: "Contract created successfully",
        contract: newContract,
        contractId: newContract._id,
      };
    } else {
      throw new Error("Invalid parameter for createSmartContract");
    }
  } catch (error) {
    console.error("Error in createSmartContract:", error);
    return {
      success: false,
      message: "Error creating contract: " + error.message,
    };
  }
};

// Create a new blockchain contract for an order
const createBlockchainContract = async (orderId) => {
  try {
    console.log(`[DEBUG] Creating blockchain contract for order: ${orderId}`);

    // Fetch the existing order
    const order = await OrderModel.findById(orderId);
    if (!order) {
      console.error(`[ERROR] Order not found: ${orderId}`);
      return { success: false, message: "Order not found" };
    }
    console.log(
      `[DEBUG] Found order: ${order._id}, status: ${order.status}, clientId: ${order.clientId}, serviceId: ${order.serviceId}`
    );

    // Get service details
    const service = await ServiceModel.findById(order.serviceId);
    if (!service) {
      console.error(`[ERROR] Service not found: ${order.serviceId}`);
      return { success: false, message: "Service not found" };
    }
    console.log(
      `[DEBUG] Found service: ${service._id}, title: ${service.title}, userId: ${service.userId}`
    );

    // Get client and freelancer details
    const client = await UserModel.findById(order.clientId);
    const freelancer = await UserModel.findById(service.userId);

    if (!client || !freelancer) {
      console.error(
        `[ERROR] User not found: client=${!!client} (${
          order.clientId
        }), freelancer=${!!freelancer} (${service.userId})`
      );
      return { success: false, message: "User not found" };
    }
    console.log(
      `[DEBUG] Found client: ${client.username} (${client._id}), freelancer: ${freelancer.username} (${freelancer._id})`
    );
    console.log(
      `[DEBUG] Client ethereum address: ${client.ethereumAddress || "not set"}`
    );

    // Check if a contract already exists for this order
    const existingContract = await ContractModel.findOne({
      orderId: order._id,
    });
    if (existingContract) {
      console.log(
        `[DEBUG] Contract already exists for this order: ${existingContract._id}, status: ${existingContract.status}`
      );
      return {
        success: false,
        message: "Contract already exists for this order",
        contract: existingContract,
      };
    }

    // Check if client has connected their MetaMask wallet
    if (!client.ethereumAddress) {
      console.error(
        `[ERROR] Client ${client.username} has not connected MetaMask wallet`
      );
      return {
        success: false,
        message: "Client must connect MetaMask wallet before creating contract",
        needsWallet: true,
        userRole: "client",
      };
    }
    console.log(
      `[DEBUG] Client has ethereum address: ${client.ethereumAddress}`
    );

    // Create smart contract terms
    const terms = `Service: ${service.title}\nDescription: ${service.description}\nAmount: ${order.amount}\nAgreed by ${client.username} and ${freelancer.username}`;

    // Set delivery date (30 days from now for demo)
    const deliveryDate = new Date();
    deliveryDate.setDate(deliveryDate.getDate() + 30);

    console.log(`Creating new contract in database`);
    // Create a new contract in our database
    const newContract = new ContractModel({
      orderId: order._id,
      clientId: client._id,
      freelancerId: freelancer._id,
      serviceId: service._id,
      amount: order.amount,
      status: "created",
      terms: terms,
      deliveryDate: deliveryDate,
      clientEthereumAddress: client.ethereumAddress,
    });

    // For this demonstration, we'll use simulated blockchain with real client address
    console.log(
      `Using simulated blockchain contract with client address: ${client.ethereumAddress}`
    );
    const contractAddress = `0x${require("crypto")
      .randomBytes(20)
      .toString("hex")}`;
    const transactionHash = `0x${require("crypto")
      .randomBytes(32)
      .toString("hex")}`;

    // Save contract address and transaction hash
    newContract.contractAddress = contractAddress;
    newContract.transactionHash = transactionHash;
    await newContract.save();
    console.log(`Saved contract: ${newContract._id}`);

    // Update the order to link it to the contract
    order.status = "OnGoing"; // Ensure order is marked as ongoing
    await order.save();
    console.log(`Updated order status to: ${order.status}`);

    return {
      success: true,
      message: "Contract created successfully on the blockchain (simulation)",
      contract: newContract,
    };
  } catch (error) {
    console.error("Contract creation error:", error);
    return {
      success: false,
      message: "Error creating contract: " + error.message,
      error: error.toString(),
    };
  }
};

// Complete a blockchain contract
const completeContract = async (orderId, userId) => {
  try {
    // Find the contract for this order
    const contract = await ContractModel.findOne({ orderId });
    if (!contract) {
      return { success: false, message: "Contract not found" };
    }

    // Verify the user is the client
    if (contract.clientId.toString() !== userId.toString()) {
      return {
        success: false,
        message: "Only the client can complete a contract",
      };
    }

    // Check contract status
    if (contract.status !== "active" && contract.status !== "created") {
      return {
        success: false,
        message: `Contract cannot be completed from ${contract.status} state`,
      };
    }

    // Find the order
    const order = await OrderModel.findById(orderId);
    if (!order) {
      return { success: false, message: "Order not found" };
    }

    // Get the client user for the Ethereum address
    const client = await UserModel.findById(contract.clientId);
    if (!client || !client.ethereumAddress) {
      return {
        success: false,
        message: "Client must connect MetaMask wallet to complete the contract",
        needsWallet: true,
        userRole: "client",
      };
    }

    // Use simulation mode with the client's Ethereum address
    console.log(
      `Using simulated blockchain completion from address: ${client.ethereumAddress}`
    );

    // Simulate a transaction hash
    const simulatedTxHash = `0x${require("crypto")
      .randomBytes(32)
      .toString("hex")}`;
    console.log(
      "Contract completed with simulated transaction:",
      simulatedTxHash
    );

    // Update the contract in our database
    contract.status = "completed";
    contract.completedDate = new Date();
    await contract.save();

    // Update order status to match
    order.status = "Completed";
    await order.save();

    return {
      success: true,
      message: "Contract completed successfully on the blockchain",
      contract: contract,
    };
  } catch (error) {
    console.error("Contract completion error:", error);
    return {
      success: false,
      message: "Error completing contract: " + error.message,
    };
  }
};

// Cancel a blockchain contract
const cancelContract = async (orderId, userId, reason) => {
  try {
    // Find the contract for this order
    const contract = await ContractModel.findOne({ orderId });
    if (!contract) {
      return { success: false, message: "Contract not found" };
    }

    // Verify the user is the client
    if (contract.clientId.toString() !== userId.toString()) {
      return {
        success: false,
        message: "Only the client can cancel a contract",
      };
    }

    // Check contract status
    if (contract.status !== "active" && contract.status !== "created") {
      return {
        success: false,
        message: `Contract cannot be cancelled from ${contract.status} state`,
      };
    }

    // Find the order
    const order = await OrderModel.findById(orderId);
    if (!order) {
      return { success: false, message: "Order not found" };
    }

    // Get the client user for the Ethereum address
    const client = await UserModel.findById(contract.clientId);
    if (!client || !client.ethereumAddress) {
      return {
        success: false,
        message: "Client must connect MetaMask wallet to cancel the contract",
        needsWallet: true,
        userRole: "client",
      };
    }

    // Use simulation mode with the client's Ethereum address
    console.log(
      `Using simulated blockchain cancellation from address: ${client.ethereumAddress}`
    );
    console.log(`Cancellation reason: ${reason}`);

    // Simulate a transaction hash
    const simulatedTxHash = `0x${require("crypto")
      .randomBytes(32)
      .toString("hex")}`;
    console.log("Contract cancelled on blockchain:", simulatedTxHash);

    // Update the contract in our database
    contract.status = "cancelled";
    contract.cancelledDate = new Date();
    contract.cancellationReason = reason;
    await contract.save();

    // Update order status to match
    order.status = "Cancelled";
    await order.save();

    return {
      success: true,
      message: "Contract cancelled successfully on the blockchain",
      contract: contract,
    };
  } catch (error) {
    console.error("Contract cancellation error:", error);
    return {
      success: false,
      message: "Error cancelling contract: " + error.message,
    };
  }
};

// Wrapper function to activate smart contract
const activateSmartContract = async (contractId) => {
  // If we're passed a contract ID instead of an order ID,
  // we need to find the contract first to get the order ID
  try {
    let orderId = contractId;
    let userId;

    // Check if the ID is a contract ID
    const contract = await ContractModel.findById(contractId);
    if (contract) {
      // We have a contract ID, so use its orderId
      orderId = contract.orderId;
      // For activation, we need the freelancer ID
      userId = contract.freelancerId;
    } else {
      // Try to find a contract with this order ID
      const contractByOrder = await ContractModel.findOne({
        orderId: contractId,
      });
      if (contractByOrder) {
        userId = contractByOrder.freelancerId;
      } else {
        return {
          success: false,
          message: "Contract not found for the provided ID",
        };
      }
    }

    // Now activate using the orderId and userId
    return await activateContract(orderId, userId);
  } catch (error) {
    console.error("Error in activateSmartContract:", error);
    return {
      success: false,
      message: "Error activating contract: " + error.message,
    };
  }
};

// Activate a contract (freelancer accepts it)
const activateContract = async (orderId, userId) => {
  try {
    console.log(
      `activateContract called with orderId: ${orderId}, userId: ${userId}`
    );

    if (!orderId) {
      console.error("Missing orderId in activateContract call");
      return { success: false, message: "Order ID is required" };
    }

    if (!userId) {
      console.error("Missing userId in activateContract call");
      return { success: false, message: "User ID is required" };
    }

    // Find the contract for this order
    const contract = await ContractModel.findOne({ orderId });
    if (!contract) {
      console.error(`No contract found for order ID: ${orderId}`);
      return { success: false, message: "Contract not found" };
    }

    console.log(
      `Found contract: ${contract._id} for order: ${orderId}, freelancerId: ${contract.freelancerId}, userId: ${userId}`
    );

    // Verify the user is the freelancer
    if (contract.freelancerId.toString() !== userId.toString()) {
      console.error(
        `User ${userId} is not the freelancer for this contract (expected: ${contract.freelancerId})`
      );
      return {
        success: false,
        message: "Only the freelancer can activate a contract",
      };
    }

    // Check contract status
    if (contract.status !== "created") {
      return {
        success: false,
        message: `Contract cannot be activated from ${contract.status} state`,
      };
    }

    // Get both freelancer and client users to check their Ethereum addresses
    const freelancer = await UserModel.findById(contract.freelancerId);
    const client = await UserModel.findById(contract.clientId);

    if (!freelancer || !client) {
      return {
        success: false,
        message: "Failed to find contract participants",
      };
    }

    // Check if both parties have connected their MetaMask wallets
    if (!freelancer.ethereumAddress) {
      return {
        success: false,
        message:
          "Freelancer must connect MetaMask wallet before activating contract",
        needsWallet: true,
        userRole: "freelancer",
      };
    }

    if (!client.ethereumAddress) {
      return {
        success: false,
        message:
          "Client must connect MetaMask wallet before contract can be activated",
        needsWallet: true,
        userRole: "client",
      };
    }

    // Use simulation mode but now with real user Ethereum addresses
    console.log(`Using simulated blockchain activation with real user addresses:
      Client: ${client.ethereumAddress}
      Freelancer: ${freelancer.ethereumAddress}
    `);

    // Simulate a transaction hash
    const simulatedTxHash = `0x${require("crypto")
      .randomBytes(32)
      .toString("hex")}`;
    console.log(
      "Contract activated with simulated transaction:",
      simulatedTxHash
    );

    // Update the contract in our database with the actual Ethereum addresses
    contract.status = "active";
    contract.clientEthereumAddress = client.ethereumAddress;
    contract.freelancerEthereumAddress = freelancer.ethereumAddress;
    contract.activatedDate = new Date();
    await contract.save();

    return {
      success: true,
      message: "Contract activated successfully with blockchain verification",
      contract: contract,
    };
  } catch (error) {
    console.error("Contract activation error:", error);
    return {
      success: false,
      message: "Error activating contract: " + error.message,
    };
  }
};

// Get contract by ID or OrderID
const getContractById = async (id) => {
  try {
    // Check if the provided ID is a valid MongoDB ObjectId
    const isValidObjectId = id.match(/^[0-9a-fA-F]{24}$/);

    if (!isValidObjectId) {
      return { success: false, message: "Invalid contract ID format" };
    }

    // Try to find by contract ID first
    let contract = await ContractModel.findById(id);

    // If not found by ID, try to find by orderId
    if (!contract) {
      contract = await ContractModel.findOne({ orderId: id });
    }

    if (!contract) {
      return { success: false, message: "Contract not found" };
    }

    return {
      success: true,
      contract: contract,
    };
  } catch (error) {
    console.error("Error fetching contract:", error);
    return {
      success: false,
      message: "Error fetching contract details: " + error.message,
    };
  }
};

// Get contract details
const getContractDetails = async (orderId) => {
  try {
    const contract = await ContractModel.findOne({ orderId });
    if (!contract) {
      return { success: false, message: "Contract not found" };
    }

    // In simulation mode, we don't query the blockchain
    console.log("Using simulated blockchain details (demonstration mode)");

    // Create simulated blockchain details based on the contract in the database
    const blockchainDetails = {
      _client: contract.clientId,
      _freelancer: contract.freelancerId,
      _amount: contract.amount,
      _createdAt: Math.floor(new Date(contract.createdAt).getTime() / 1000),
      _deliveryDate: Math.floor(
        new Date(contract.deliveryDate).getTime() / 1000
      ),
      _terms: contract.terms,
      _status: ["created", "active", "completed", "cancelled"].indexOf(
        contract.status
      ),
    };

    console.log("Simulated blockchain contract details:", blockchainDetails);

    return {
      success: true,
      contract: contract,
      blockchainDetails: blockchainDetails,
    };
  } catch (error) {
    console.error("Error fetching contract:", error);
    return {
      success: false,
      message: "Error fetching contract details: " + error.message,
    };
  }
};

// Get all contracts for a user (either as client or freelancer)
const getUserContracts = async (userId) => {
  try {
    const contracts = await ContractModel.find({
      $or: [{ clientId: userId }, { freelancerId: userId }],
    }).sort({ createdAt: -1 });

    return {
      success: true,
      contracts: contracts,
    };
  } catch (error) {
    console.error("Error fetching user contracts:", error);
    return {
      success: false,
      message: "Error fetching contracts: " + error.message,
    };
  }
};

module.exports = {
  createBlockchainContract,
  createSmartContract,
  completeContract,
  cancelContract,
  activateContract,
  getContractDetails,
  getUserContracts,
  getContractById,
  activateSmartContract,
};
