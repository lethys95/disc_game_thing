# Inspiration posts

## one



Prepare the images or videos that represent the look you want to achieve. Create a separate folder for them, for example: Game/Ref.

Connect Godot MCP and Blender MCP to Codex.

Let Astra read the files inside the Ref. folder so it can understand the overall visual direction and style you want.

If possible, install the Dream-loop skill. It can help the AI work more effectively and make your game visuals match the references more closely



## two

 Use chatgpt to generate an image, then generate multiple images (if I can't get a good perspective I put it in a video generator and ask it to rotate it as a 3D model, that tends to work really well). Then I put it in tripo multi view, use the P2 model and then send it to blender. In blender I have Astra repair the topology, make any changes I want and then texture it. Once texturing is done I have it save it as a reference model and then ask it to cut the triangles down to whatever I need it at, granting it additional leeway if it looks bad.

Still working on the optimize + repaint step as I'm painting by faces and that all gets messed up when I reduce them, though I have a few ideas for workflow changes to make it fine anyway. 

## three

 This threejs experience am building is going to be insanely amazing.

Built a tiny harbour town - an apartment I can't move into 🏮

Started with a single illustration.
This will turn it into a whole explorable city with Opus 5.5 + Blender + Three.js.
little robots wandering the piers.
warm windows over teal water.
a boat you can actually take out in the rain.

cozy little worlds where you come to look around and accidentally spend the evening.

Stay tuned..

Follow for more 


## Four

 I always wanted to print a full table for our D&D campaign. The table is 148 x 238 cm, that's a lot of surface to fill. The classic way is months of foam, glue and paint, so I'm running it like a game production instead, with GPT-6 Astra driving.

    Astra blocked out the whole town in primitives first. Boxes standing in for houses, roads, open squares. We also made a small mood reference so we both knew what the town should feel like. Everything is cheap to move around while it's still a box.

    Buildings I generate in 3DAIStudio. Image reference for each house first, then the 3D model from it. Getting the picture first matters: a house I don't like dies in seconds instead of after the model is done. I kept switching generators inside it, some houses came out better in Tripo 3.1, some in Hi3D 3.0, it's all in one box there. It also plugs into your agent over MCP. And Meshy 7.1 is landing there soon, promising 4k resolution, will see.

    We drop the finished models back into the blockout and keep filling until it reads like a town instead of a pile of props. Street widths, where the open space goes, what's tall, what's low.

    Now the part I'm starting today: cutting every house into floors. Ground floor, upper floor, roof, stacked so they lift off. Roof comes off, you play the top floor. A house that doesn't open is scenery, and I want the party to go inside. The generator only gives me the outside, so every floor gets a floor plate, walls with printable thickness, doorways wide enough for a base, stairs where they make sense.

First batch goes on the printer as I finish cutting. 148 x 238 cm is going to keep that printer running for weeks and I'm fine with that

To be continued..



## Five


0:05 / 2:40

Stress test of Opus 5.5 for 3D world building.

The whole island was created with surprisingly little technical direction. Most of the prompts were apparently closer to “add X and Y” or “this looks weird, make it better” rather than detailed implementation instructions.

Some details are especially interesting:

    birds flying and diving into the ocean

    cloth, signs and lights reacting to wind

    crabs moving along the shore and burrowing

    fish swimming next to the whale

    dynamic lighting across the island at night

    the full scene staying above 60 FPS at 1440p

The absurd part is the compute cost: roughly $1,874 worth of Opus 5.5 tokens, with around two hours of API usage across multiple subagents.

There are still obvious bugs, artifacts and texture issues, but as a test of how much of an interactive 3D environment can now be built through natural-language direction, this is pretty interesting.



## Six

 Wild workflow combining GPT-6 Astra with Marvelous Designer.

It was given a character reference and then used Marvelous Designer’s Python API + computer control to build the outfit directly inside MD.

The interesting part is that it didn’t just generate something that looks like clothing:

    created the 2D sewing patterns

    assembled the garment inside Marvelous Designer

    handled the layer relationships

    ran the actual cloth simulation

    reproduced details like the cardigan structure and knit pattern

The creator says the clothing was made from essentially one character reference, with no manual cleanup to the garment itself apart from some minor accessory issues.

Going from a character image to an actually simulated, editable MD garment feels like a much more useful direction for AI-assisted 3D workflows than simply generating another mesh. 


## Seven

 Spent a day testing it on actual 3D tasks in Blender: character animation, rigging, full scenes, VFX, sound effects and game-related workflows.

Tested everything mirrored against GPT-6 Astra at Max effort. Opus didn’t win every test, and I kept those cases in the video too.

[Note from me - It worked really well. Animations are actually pretty smooth]

## Eight

 The project combines GPT-6 Astra, Opus 5.5, Blender and Unreal Engine to handle different parts of game development instead of trying to make one model do everything.

The pipeline here was built around:

    GPT-6 Astra

    Opus 5.5

    Tripo AI

    Blender

    Unreal Engine

Before this, I was using more ready-made assets, but they felt too lifeless and lacked realism. So I started reworking more of the characters and scene elements directly in Blender.

Tripo P2 helped a lot with getting character and asset foundations in place faster, while Opus 5.5 was useful for building and refining assets inside the workflow. Astra still feels stronger when it comes to understanding more complex 3D tasks overall, even if the token usage can get pretty crazy.

What I like most about this kind of setup is that it’s not really “one-click game development.” It’s more like using different AI tools for specific jobs and combining them into one workflow that actually saves time.

Even with the hardware limitations, this stuff is getting seriously useful.

p.s my 16gb macbook is starting to struggle pretty badly with Unreal, so I’m thinking about moving back to Godot for whatever I build next. Because of that, this will probably be my last project using this exact setup for a while. Kind of a shame, because the workflow itself has been really fun to experiment with, but at some point the hardware politely tells you to stop pretending it’s a workstation. 


## Nine


 OpenAI just released GPT-6 Astra, and the most interesting part for 3D is not another coding benchmark. It looks much closer to an AI technical artist than a normal chatbot.

In one of the launch demos, a reference image of a modern house was turned into a complete Blender scene with architecture, furniture, kitchen appliances and smaller props, then moved into Unreal Engine 5 as a walkable environment. The creator says the geometry remained editable and the local interactive version ran at 60 fps.

The important detail is how Astra does this. It is not directly generating one baked mesh like a dedicated image-to-3D model. For the house demo, it reportedly used Blender in headless/CLI mode and wrote Python to construct and revise the scene. It can also control Blender through computer use: another early tester asked it to make a humanoid wolf and got a Blender model in roughly eight minutes.

There is finally a relevant quantitative result too. OpenAI reports a 95.9% geometric-overlap score on BenchCAD with tools, compared with 83.3% for GPT-5.6 Sol and 84.3% for Claude Fable 5.1. BenchCAD gives the model four orthographic renders of an industrial part and asks it to rebuild the object as executable CadQuery code, so it is a useful test of spatial reasoning and programmatic CAD.

What feels new is the full workflow. Astra can reason about object placement, scale, cameras, materials and lighting, generate or edit the scene, move it into an engine, and test the playable result. Early users have also shown one-shot browser 3D games and larger Unreal worlds that kept developing for days.

There is still a big reality check. Most public evidence currently comes from OpenAI and selected early-access testers. The BenchCAD number is vendor-reported on a tool-enabled 1,000-part subset, not an independent full public run. We have not yet seen a proper audit of character topology, UVs, rigging, deformation, exact architectural dimensions, LODs or production optimization. Early reviewers also had to fix controls, performance and generic art direction. 


## Ten

 After building the original Rocket League-style prototype, I gave ChatGPT Astra one more instruction: turn the entire game into LEGO.

Astra used the 3DAIStudio MCP + Tripo P2 to generate the new LEGO-style 3D assets, import them into the project, and rebuild the environment while keeping everything playable.

The workflow was basically:

    Astra decided which assets needed replacing

    generated references for them

    sent them through 3DAIStudio

    Tripo P2 converted them into 3D models

    Astra imported everything and rebuilt the scene

It changed the cars, arena, field, ball, props—and somehow even made the weather effects look like LEGO pieces. This is sick!

What started as a simple Rocket League-style prototype turned into a full LEGO Edition through a single follow-up instruction. This combination is getting ridiculous. 


## Eleven (maybe less good, idk)


Q:


Hi everyone,

I'm trying to use AI tools to create 3D models and animations, and I've seen some crazy good results here using Tripo combined with GPT.

I noticed people often separate their models into individual parts, generate/process them separately, and then assemble them together. However, when using Tripo, I'm not entirely sure how to execute this process effectively.

A few questions I have:

    How do you properly break down and generate models in parts using Tripo?

    What kind of concept art/inputs give the best results (since there are various options)?

    Could anyone share their step-by-step workflow from initial concept art to final model?

Thanks a lot for the help!


A:
 I think they mean to split up the elements into different images. Character could be split up into just the legs or just the shoes or some headwear.

More detailed and precise because tripo and other AI tools haven't to generate the whole character with its different specs all at ones.

Hairs often already too complex or a abstract character with complex skin or just material difference on the clothes could make the AI detect something different. 


## Twelve

 Created this entire animation scene in Blender with Claude Opus 5.5.

- Loaded in existing models of the Ford Bronco off-road vehicle and let Claude rig it with dynamic suspension that reacts to a live-terrain which I can adjust and no matter how I change the terrain it would dynamically adjust. The car follows a path that I can drag and tweak to change its path if necessary.

- Then it rigged the spider for me and animated it chasing the car so it would always follow the car's path and dynamically adjust if I altered the path of the car. 

Q:


Can you give a little breakdown of how you prompted claude to achieve this? It looks good to me. I've never used blender for animation, just for modeling, and it would be great to hear how you approach the animation aspect using claude


A:


Not very spectacular. I outlined it in the body text a bit. It was mostly about getting the rigs working (with several iterations of explaining to Claude what I needed) and for me able to adjust things easily. Be it the terrain or the car path or the spider with the run/ walk cycle.

I would use the playblasts as motion references and camera blocking for Seedance renders.


Q:



How technical did your prompts have to go? Did you have to instruct claude about different rigging techniques and how they work in blender? Did you have to get into details about constraints or any other specifics?


A:



Basic instructions after I asked it to rig it appropriately to achieve a realistic spider walk cycle. I did have to instruct it to correct overlapping mistakes with joint/ "knee" constraints. But other than that it achieved the rigs all by itself and then it was just some iterations to correct some little issues.


## Thirteen ( This on might just be somneone trying to sell their own product, can't really see)

 If you’ve ever tried to move a 3D model with no rig, skinning, or weight painting, you know how much work stands between you and a simple pose. I wanted it to feel as immediate as moving pins in 2D. Monster Mash was a big inspiration.

So I started experimenting, and I think I’ve got it working. With Warp 3D, you upload a model, place a few pins, and start moving it. Smooth ARAP deformation over a voxelized volume makes the mesh follow, and the timeline automatically fills in the movement between poses. There’s inverse kinematics too, so you can move a paw or hand and have the limb follow.

I honestly think this solves the “I just want to move this model” problem. When you’re done, you can export an animated GLB or glTF, export the current pose as a GLB, or save an editable Warp 3D project.

AI is optional: you can refine animations using a Gemini API key or sign in with ChatGPT to use your Codex subscription (beta). The desktop app also supports MCP, so you can connect your own compatible AI agent to control the editor.

The video shows it in action. Enjoy!

Try it here Warp Studio 


## Bits and pieces

 my test. just prompted "make a cute house in blender MCP"

turned out pretty cute. all I had to do was turn the knome around. not sure what that wooden desk things is doing there.

it pulled some random assets from PolyHaven and textures.

I think this cost around $5 in tokens. cute test, wont use it for something this full featured again. gets pricey too quick 


----- 
 I did something very similar recently.
I manually (ai walked me throught it) rigged and animated a squirrel that took forever.
Used meshy to 3d render my dog.
Had astra create a Blender workspace, uploaded the fbx file and asked it to add rigging for a dog and create animations for walk, run, crawl, jump, rear up, right paw swipe, left paw swipe, bite and sleep.

Almost as simple of a prompt.

It took 20 minutes and then gave me the files and even put together an mp3 preview.

The fur on legs was pointing so the weights were bad with leg extended. I gave it a screenshot of the issue and had it redo the weights of fur and fix.

Round 2 much better. Jump is weird and basically straight up and down like the OP. Sleep just sort of falls to side.

But its amazing what it did. I can certainly guide it with prompting. For instance, ask it to redo jump but have it slightly leap forward and make the head move naturally like a real dog jumping.

I will also prompt it to sniff the ground.

As for the squirrel, that was more work as I rendered separate armor, weapons and belt/bag. I didn’t try using Astra to outfit the squirrel. For instance the squirrel ears come out of the helmet. It took a lot of adjustments. Not sure Astra could have done that well without several retries. 


-----


 One prompt, Blender only, all procedural. Render the 10-second shot, and record your own build timelapse.

Opus 5.5: 35 min, 199.6k output tokens, about $13.3 in API terms.
GPT-6 Astra: 28 min, 56.6k output tokens, about $14.5 in API terms.

Feels like a worthy rival, and honestly I am glad about that. From what I watched, Opus juggles way more at once and is faster overall. Astra is still good imo. 



----


## Final notes from me

It seems to me like blender mcp might actually be able to do more than we give it credit for. At least with effects, static meshes like trees and possible light shuffling like wind and whatever else. A lot of technology choices are discussed in these posts, and I think there are things we can learn from all this.