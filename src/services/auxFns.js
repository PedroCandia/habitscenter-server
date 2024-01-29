const auxFns = {}

auxFns.sleep = async (delayTime) => {
    await new Promise(resolve => setTimeout(resolve, delayTime));
}

module.exports = auxFns;