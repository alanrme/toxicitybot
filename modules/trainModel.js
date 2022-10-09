import * as tf from "@tensorflow/tfjs-node-gpu"

export async function trainModel(xTrain, yTrain) {
    const model = tf.sequential()

    model.add(tf.layers.dense({
        units: 1,
        activation: "sigmoid",
        inputShape: [xTrain.shape[1]]
    }))

    const learnRate = 0.01
    const optimizer = tf.train.adam(learnRate)
    model.compile({
        optimizer: optimizer,
        loss: "meanSquaredError",
        metrics: ["accuracy"]
    })

    const history = await model.fit(xTrain, yTrain, {
        epochs: 50, // number of iterations
        //validationData: [xTest, yTest],
        callbacks: {
            onEpochEnd: async (epoch, logs) => {
                console.log(epoch + ", " + logs.loss)
                await tf.nextFrame()
            }
        }
    })

    return model
}