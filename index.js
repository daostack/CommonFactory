const ethers = require('ethers');
// Is the voteParams same for all/some schemes of a common?

// TODO: Edit constants/ Make them function params
const arcVersion = "0.1.2-rc.6";

const NULL_ADDRESS = '0x0000000000000000000000000000000000000000';

function getForgeOrgData({
    DAOFactoryInstance,
    orgName,
    founderAddresses,
    repDist,
    votingMachine,
    fundingToken,
    minFeeToJoin,
    memberReputation,
    goal,
    deadline,
    metaData
}) {
    let daoTokenABI = require('./abis/DAOToken.json');

    let daoToken = new ethers.utils.Interface(daoTokenABI);
    const daoTokenArgs = Object.values({
        tokenName: '',
        tokenSymbol: '',
        tokenCap: 0,
        DAOFactoryInstance
    });
    let daoTokenCallData = daoToken.functions.initialize.encode(daoTokenArgs);
    let tokenDist = [];
    for (let i = 0; i < founderAddresses.length; i++) {
        tokenDist.push(0);
    }

    let encodedForgeOrgParams = (new ethers.utils.AbiCoder()).encode(
        ['string', 'bytes', 'address[]', 'uint256[]', 'uint256[]', 'uint64[3]'],
        [
            orgName,
            daoTokenCallData,
            founderAddresses,
            tokenDist,
            repDist,
            [0, 1, getArcVersionNumber(arcVersion)]
        ]
    );

    let joinABI = require('./abis/Join.json');
    let fundingRequestABI = require('./abis/FundingRequest.json');
    let schemeFactoryABI = require('./abis/SchemeFactory.json');
    let dictatorABI = require('./abis/Dictator.json');
    let reputationAdminABI = require('./abis/ReputationAdmin.json');

    let join = new ethers.utils.Interface(joinABI);
    let fundingRequest = new ethers.utils.Interface(fundingRequestABI);
    let schemeFactory = new ethers.utils.Interface(schemeFactoryABI);
    let dictator = new ethers.utils.Interface(dictatorABI);
    let reputationAdmin = new ethers.utils.Interface(reputationAdminABI);

    let joinParams = require('./schemesVoteParams/JoinParams.json');
    let fundingRequestParams = require('./schemesVoteParams/FundingRequestParams.json');
    let schemeFactoryParams = require('./schemesVoteParams/SchemeFactoryParams.json');

    const joinArgs = Object.values({
        avatar: NULL_ADDRESS,
        votingMachine,
        votingParams: [
            joinParams.queuedVoteRequiredPercentage,
            joinParams.queuedVotePeriodLimit,
            joinParams.boostedVotePeriodLimit,
            joinParams.preBoostedVotePeriodLimit,
            joinParams.thresholdConst,
            joinParams.quietEndingPeriod,
            joinParams.proposingRepReward.toString(),
            joinParams.votersReputationLossRatio,
            joinParams.minimumDaoBounty.toString(),
            joinParams.daoBountyConst,
            joinParams.activationTime
        ],
        voteOnBehalf: joinParams.voteOnBehalf,
        joinParamsHash: "0x0000000000000000000000000000000000000000000000000000000000000000",
        fundingToken,
        minFeeToJoin,
        memberReputation,
        goal,
        // set the funding gaol to 0 and the funding gaol far to the future: this will allow us to call
        // setfundinggaoldeadline() and start creating funding requests as soon as the fundingRequest scheme is active
        deadline: new Date(2222, 1, 1).getTime() / 1000
    });

    const fundingRequestArgs = Object.values({
        avatar: NULL_ADDRESS,
        votingMachine,
        votingParams: [
            fundingRequestParams.queuedVoteRequiredPercentage,
            fundingRequestParams.queuedVotePeriodLimit,
            fundingRequestParams.boostedVotePeriodLimit,
            fundingRequestParams.preBoostedVotePeriodLimit,
            fundingRequestParams.thresholdConst,
            fundingRequestParams.quietEndingPeriod,
            fundingRequestParams.proposingRepReward.toString(),
            fundingRequestParams.votersReputationLossRatio,
            fundingRequestParams.minimumDaoBounty.toString(),
            fundingRequestParams.daoBountyConst,
            deadline // this is the activationDate for the funding request
        ],
        voteOnBehalf: fundingRequestParams.voteOnBehalf,
        fundingRequestParamsHash: "0x0000000000000000000000000000000000000000000000000000000000000000",
        fundingToken,
    });

    const schemeFactoryArgs = Object.values({
        avatar: NULL_ADDRESS,
        votingMachine,
        votingParams: [
            schemeFactoryParams.queuedVoteRequiredPercentage,
            schemeFactoryParams.queuedVotePeriodLimit,
            schemeFactoryParams.boostedVotePeriodLimit,
            schemeFactoryParams.preBoostedVotePeriodLimit,
            schemeFactoryParams.thresholdConst,
            schemeFactoryParams.quietEndingPeriod,
            schemeFactoryParams.proposingRepReward.toString(),
            schemeFactoryParams.votersReputationLossRatio,
            schemeFactoryParams.minimumDaoBounty.toString(),
            schemeFactoryParams.daoBountyConst,
            schemeFactoryParams.activationTime
        ],
        voteOnBehalf: schemeFactoryParams.voteOnBehalf,
        schemeFactoryParamsHash: "0x0000000000000000000000000000000000000000000000000000000000000000",
        DAOFactoryInstance,
    });

    const dictatorArgs = Object.values({
        avatar: NULL_ADDRESS,
        owner: '0xbBb06cD354D7f4e67677f090eCc3f6E5916E2447'
    });

    const reputationAdminArgs = Object.values({
        avatar: NULL_ADDRESS,
        activationStartTime: 0,
        activationEndTime: new Date(2222, 1, 1).getTime() / 1000,
        maxRepReward: 0,
        owner: '0xCF8d68F810Cb8E3E228A7F31A61bEf0C1700A7d5'
    });
    
    var joinCallData = join.functions.initialize.encode(joinArgs);
    var fundingRequestCallData = fundingRequest.functions.initialize.encode(fundingRequestArgs);
    var schemeFactoryCallData = schemeFactory.functions.initialize.encode(schemeFactoryArgs);
    var dictatorCallData = dictator.functions.initialize.encode(dictatorArgs);
    var reputationAdminCallData = reputationAdmin.functions.initialize.encode(reputationAdminArgs);

    var encodedSetSchemesParams = (new ethers.utils.AbiCoder()).encode(
        ['bytes32[]', 'bytes', 'uint256[]', 'bytes4[]', 'string'],
        [
            [
                ethers.utils.formatBytes32String('Join'),
                ethers.utils.formatBytes32String('FundingRequest'),
                ethers.utils.formatBytes32String('SchemeFactory'),
                ethers.utils.formatBytes32String('Dictator'),
                ethers.utils.formatBytes32String('ReputationAdmin')
            ],
            concatBytes(concatBytes(concatBytes(concatBytes(joinCallData, fundingRequestCallData), schemeFactoryCallData), dictatorCallData), reputationAdminCallData),
            [
                getBytesLength(joinCallData),
                getBytesLength(fundingRequestCallData),
                getBytesLength(schemeFactoryCallData),
                getBytesLength(dictatorCallData),
                getBytesLength(reputationAdminCallData)
            ],
            ['0x00000000', '0x00000000', '0x0000001F', '0x0000001F', '0x0000001F'],
            metaData
        ]
    );

    return [
        encodedForgeOrgParams,
        encodedSetSchemesParams
    ];
}

// Helpers

function concatBytes(bytes1, bytes2) {
    return bytes1 + (bytes2.slice(2));
}
  
function getBytesLength(bytes) {
    return Number(bytes.slice(2).length) / 2;
}

function getArcVersionNumber(arcVersion) {
    return Number(arcVersion.split('rc.')[1]);
}

module.exports = {
    getForgeOrgData
};
