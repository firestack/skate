{
	description = "virtual environments";

	inputs.devshell.url = "github:numtide/devshell";
	inputs.flake-parts.url = "github:hercules-ci/flake-parts";

	outputs = inputs@{ self, flake-parts, devshell, nixpkgs }:
		flake-parts.lib.mkFlake { inherit inputs; } {
			imports = [
				devshell.flakeModule
				./.devshell/skate.nix
			];

			systems = [
				"aarch64-darwin"
				"aarch64-linux"
				"i686-linux"
				"x86_64-darwin"
				"x86_64-linux"
			];

			perSystem = { config, self', ... }: {
				devShells.default = self'.devShells.skate;
			};
		};
}
