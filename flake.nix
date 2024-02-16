{
	description = "Skate: Gliding on Wheels";

	inputs = {
		beam-flakes = {
			url = "github:shanesveller/nix-beam-flakes";
			inputs.flake-parts.follows = "flake-parts";
			inputs.nixpkgs.follows = "nixpkgs";
		};
		flake-parts.url = "github:hercules-ci/flake-parts";
		nixpkgs.url = "github:NixOS/nixpkgs/nixpkgs-unstable";
	};

	outputs = inputs @ {
		beam-flakes,
		flake-parts,
		...
	}:
		flake-parts.lib.mkFlake {inherit inputs;} {
			imports = [beam-flakes.flakeModule];

			systems = ["aarch64-darwin" "x86_64-darwin" "x86_64-linux"];

			perSystem = { pkgs, ... }: {
				beamWorkspace = {
					enable = true;
					devShell = {
						languageServers.elixir = true;
						languageServers.erlang = false;
						phoenix = true;
						extraPackages = [
							pkgs.nodejs_20
							pkgs.adrgen
							pkgs.entr
						];
					};
					versions = {
						fromToolVersions = ./.tool-versions;
					};
				};
			};
		};
}
