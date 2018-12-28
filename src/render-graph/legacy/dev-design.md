# renderGraph

renderGraph是声明式的渲染流程的探索实现。

有很多计算模型是流式的，比如参数化建模，比如CICD，某一个环节依赖前面若干个环节。渲染也是如此，这种模型我们称之为pipeline。pipeline其实可以抽象成若干个节点，通过依赖相互连接，形成图。整个计算流程被一张图所描述。

web3d领域存在诸多成熟的方案例如threejs，babylon等，但是这些东西都只能称之为库，不能称之为框架。是因为这些东西大多是gl的实现，你为了在页面上某处显示3d，你引入了这个库，使用了这个库，完成了你的目标，但是在这个环节中，你没有，或者说很难，提供了自己的实现。为了修改three的管线，你要花上几乎一周的时间，把three的从几何如何描述，到从字符串拼接shader的所有流程，都要了解清除，你才能改。有的可能不如改管线如此麻烦，只要继承个类就好，但是你见过three的文档里有教你说如何扩展three，给他写插件吗，没有。这些库，并没有太多考虑让用户能够修改和拓展的考虑，自己定制的修改就显得很困难。我们在webgl领域缺少框架级别的开源项目，能够为基于webgl的前端图形表现提供灵活高效强大的基础设施支持。