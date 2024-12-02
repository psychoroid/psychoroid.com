## strangerzonehf/Flux-3DXL-Partfile-0001

3DXLP1, a medium-sized woman stands in front of a dark gray background. She is dressed in a black bra, adorned with a scalloped design. Her hair is styled in a sleek bob, adding a touch of texture to her face. Her lips are painted a vibrant red, while her lips are pursed. Her right hand is raised in the air, holding a cigarette in her left hand. Her eyes are a piercing blue, and her eyebrows are a darker shade of brown. The lighting is subdued, creating a stark contrast against the dark background.

3DXLP1, a close-up shot of a bald man with blue eyes and a smile on his face. He is wearing a black and gray striped scarf around his neck, with a silver lanyard hanging from the collar. The backdrop is a dark gray, creating a stark contrast to the bald mans face.

3DXLP1, A close-up portrait of a man with long brown hair and a goatee. He is wearing a dark green button-down shirt. His eyes are blue and he has a nose ring on his nose. His eyebrows are covered in red marks. The background is a solid gray color.

3DXLP1, a close-up shot of a womans face features a neutral expression. Her eyes are a piercing blue, and her hair is a vibrant shade of brown. She is wearing a black turtleneck, with a yellow vest draped over her shoulders. The background is a solid black, creating a stark contrast to the womans outfit.
Model description for 3DXL Partfile 0001
Image Processing Parameters

Parameter	Value	Parameter	Value
LR Scheduler	constant	Noise Offset	0.03
Optimizer	AdamW	Multires Noise Discount	0.1
Network Dim	64	Multires Noise Iterations	10
Network Alpha	32	Repeat & Steps	25 & 3100
Epoch	20	Save Every N Epochs	1
Labeling: florence2-en(natural language & English)

Total Images Used for Training : 27

Best Dimensions & Inference
Dimensions	Aspect Ratio	Recommendation
1280 x 832	3:2	Best
1024 x 1024	1:1	Default
Inference Range
Recommended Inference Steps: 30–35
Setting Up
import torch
from pipelines import DiffusionPipeline

base_model = "black-forest-labs/FLUX.1-dev"
pipe = DiffusionPipeline.from_pretrained(base_model, torch_dtype=torch.bfloat16)

lora_repo = "strangerzonehf/Flux-3DXL-Partfile-0001"
trigger_word = "3DXLP1"  
pipe.load_lora_weights(lora_repo)

device = torch.device("cuda")
pipe.to(device)

Trigger words
You should use 3DXLP1 to trigger the image generation.

Download model
Weights for this model are available in Safetensors format.

Download them in the Files & versions tab.