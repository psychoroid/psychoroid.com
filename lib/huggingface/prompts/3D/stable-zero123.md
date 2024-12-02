## stabilityai/stable-zero123 

Stable Zero123
Please note: For commercial use, please refer to https://stability.ai/license

Model Description
Stable Zero123 is a model for view-conditioned image generation based on Zero123.

With improved data rendering and model conditioning strategies, our model demonstrates improved performance when compared to the original Zero123 and its subsequent iteration, Zero123-XL.


Usage
By using Score Distillation Sampling (SDS) along with the Stable Zero123 model, we can produce high-quality 3D models from any input image. The process can also extend to text-to-3D generation by first generating a single image using SDXL and then using SDS on Stable Zero123 to generate the 3D object.

To enable open research in 3D object generation, we've improved the open-source code of threestudio by supporting Zero123 and Stable Zero123. To use Stable Zero123 for object 3D mesh generation in threestudio, you can follow these steps:

Install threestudio using their instructions
Download the Stable Zero123 checkpoint stable_zero123.ckpt into the load/zero123/ directory
Take an image of your choice, or generate it from text using your favourite AI image generator such as Stable Assistant (https://stability.ai/stable-assistant) E.g. "A simple 3D render of a friendly dog"
Remove its background using Stable Assistant (https://stability.ai/stable-assistant)
Save to load/images/, preferably with _rgba.png as the suffix
Run Zero-1-to-3 with the Stable Zero123 ckpt:
python launch.py --config configs/stable-zero123.yaml --train --gpu 0 data.image_path=./load/images/hamburger_rgba.png

Model Details
Developed by: Stability AI
Model type: latent diffusion model.
Finetuned from model: lambdalabs/sd-image-variations-diffusers
License: We released 2 versions of Stable Zero123.
Stable Zero123 included some CC-BY-NC 3D objects, so it cannot be used commercially, but can be used for research purposes. It is released under the Stability AI Non-Commercial Research Community License.
Stable Zero123C (“C” for “Commercially-available”) was only trained on CC-BY and CC0 3D objects. It is released under StabilityAI Community License. You can read more about the license here. According to our internal tests, both models perform similarly in terms of prediction visual quality.
Training Dataset
We use renders from the Objaverse dataset, utilizing our enhanced rendering method

Training Infrastructure
Hardware: Stable Zero123 was trained on the Stability AI cluster on a single node with 8 A100 80GBs GPUs.
Code Base: We use our modified version of the original zero123 repository.
Misuse, Malicious Use, and Out-of-Scope Use
The model should not be used to intentionally create or disseminate images that create hostile or alienating environments for people. This includes generating images that people would foreseeably find disturbing, distressing, or offensive; or content that propagates historical or current stereotypes.