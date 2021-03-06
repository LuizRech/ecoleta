import React, { useEffect, useState, ChangeEvent, FormEvent } from 'react';
import { Link, useHistory } from 'react-router-dom';
import { FiArrowLeft } from 'react-icons/fi';
import { Map, TileLayer, Marker } from 'react-leaflet';
import { LeafletMouseEvent } from 'leaflet';
import axios from 'axios';

import logo from '../../assets/logo.svg';
import api from '../../services/api';
import Dropzone from '../../components/dropzone/index';

import './styles.css';

interface Item {
	id: number;
	title: string;
	image_url: string;
}

interface IBGEUFResponse {
	sigla: string;
}

interface IBGECityResponse {
	nome: string;
}

const CreatePoint = () => {
		const history = useHistory();

		const [items, setItems] = useState<Item[]>([]);
		const [ufs, setUfs] = useState<string[]>([]);
		const [cities, setCities] = useState<string[]>([]);

		const [initialPosition, setInitialPosition] = useState<[number, number]>([0,0]);
		const [selectedPositionMap, setSelectedPositionMap] = useState<[number, number]>([0,0]);

		const [selectedUf, setSelectedUf] = useState<string>('0');
		const [selectedCity, setSelectedCity] = useState<string>('0');

		const [selectedItems, setSelectedItems] = useState<number[]>([]);

		const [selectedFile, setSelectedFile] = useState<File>();

		const [formData, setFormData] = useState({
			name: '',
			email: '',
			whatsapp: ''
		});
		
		useEffect(() => {
			navigator.geolocation.getCurrentPosition(position => {
				const {latitude, longitude} = position.coords;
				
				setInitialPosition([latitude, longitude]);
			})
		}, []);

		useEffect(() => {
			axios.get<IBGEUFResponse[]>('https://servicodados.ibge.gov.br/api/v1/localidades/estados').then(response => {
				const ufInitials = response.data.map(uf => uf.sigla);
				
				setUfs(ufInitials);
			});
		}, []);

		useEffect(() => {
			if(selectedUf === '0'){
				return;
			}

			axios
				.get<IBGECityResponse[]>(`https://servicodados.ibge.gov.br/api/v1/localidades/estados/${selectedUf}/distritos`)
				.then(response => {
					const cityNames = response.data.map(city => city.nome);
				
					setCities(cityNames);
				})
		}, [selectedUf])

		useEffect(() => {
			api.get('items').then(response => {
				setItems(response.data);
			})
		}, []);
		
		function handleChangedUf(event: ChangeEvent<HTMLSelectElement>){
			const uf = event.target.value;

			setSelectedUf(uf)
		}
		
		function handleChangedCity(event: ChangeEvent<HTMLSelectElement>){
			const city = event.target.value;

			setSelectedCity(city)
		}

		function handleMapClick(event: LeafletMouseEvent){
			setSelectedPositionMap([
				event.latlng.lat,
				event.latlng.lng,
			]);
		}

		function handleChangeForm(event: ChangeEvent<HTMLInputElement>){
			const {name, value} = event.target;

			setFormData({
				...formData,
				[name]: value
			})
		}

		function handleSelectItems(id: number){
			const alreadyItems = selectedItems.findIndex(item => item === id);

			if(alreadyItems >= 0){
				const filteredItems = selectedItems.filter(item => item !== id);

				setSelectedItems(filteredItems);
			}else{
				setSelectedItems([...selectedItems, id]);
			}

		}

		async function handleSubmitForm(event: FormEvent){
			event.preventDefault();


			const {name, email, whatsapp} = formData;
			const uf = selectedUf;
			const city = selectedCity;
			const [latitude, longitude] = selectedPositionMap;
			const items = selectedItems;

			const data = new FormData();

			data.append('name', name);
			data.append('email', email);
			data.append('whatsapp', whatsapp);
			data.append('uf', uf);
			data.append('city', city);
			data.append('latitude', String(latitude));
			data.append('longitude', String(longitude));
			data.append('items', items.join(','));

			if(selectedFile){
				data.append('image', selectedFile);
			}
	
			await api.post('points', data);

			alert("Cadastrou")
			
			history.push('/');
		}

		return (
			<div id="page-create-point">
				<header>
					<img src={logo} alt="Ecoleta" />

					<Link to="/">
						<FiArrowLeft />
						Voltar para a home
					</Link>
				</header>


				<form onSubmit={handleSubmitForm}>
					<h1>Cadastro do <br /> novo ponto de coleta</h1>

					<Dropzone onFileUploaded={setSelectedFile}/>
					<fieldset>
						<legend>
							<h2>Dados</h2>
						</legend>
					</fieldset>

					<div className="field">
						<label htmlFor="name">Nome da entidade</label>
						<input
							type="text"
							name="name"
							id="name"
							onChange={handleChangeForm}
						/>
					</div>

					<div className="field-group">
						<div className="field">
							<label htmlFor="email">E-mail</label>
							<input
								type="email"
								name="email"
								id="email"
								onChange={handleChangeForm}
							/>
						</div>

						<div className="field">
							<label htmlFor="whastapp">Whatsapp</label>
							<input
								type="text"
								name="whatsapp"
								id="whatsapp"
								onChange={handleChangeForm}
								/>
						</div>
					</div>

					<fieldset>
						<legend>
							<h2>Endereço</h2>
							<span>Selecione o endereço no mapa</span>
						</legend>
					</fieldset>

					<Map
						center={initialPosition}
						zoom={15}
						onClick={handleMapClick}
					>
						<TileLayer
							attribution='&amp;copy <a href="http://osm.org/copyright">OpenStreetMap</a> contributors'
							url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      	  	/>
						<Marker position={selectedPositionMap} />
					</Map>

					<div className="field-group">
						<div className="field">
							<label htmlFor="uf">Estado (UF)</label>
							<select
								onChange={handleChangedUf}
								name="uf" 
								id="uf"
								value={selectedUf}
							>
								<option value="0">Selecione uma UF</option>
								{ufs.map(uf => (
									<option key={uf} value={uf}>{uf}</option>
								))}
							</select>
						</div>
						<div className="field">
							<label htmlFor="cidade">Cidade</label>
							<select
								name="cidade" 
								id="cidade"
								onChange={handleChangedCity}
								value={selectedCity}
							>
								<option value="0">Selecione uma cidade</option>
								{cities.map(city => (
									<option key={city} value={city}>{city}</option>
								))}
							</select>
						</div>
					</div>

					<fieldset>
						<legend>
							<h2>Ítens de coleta</h2>
							<span>Selecione um ou mais itens abaixo</span>
						</legend>
					</fieldset>

					<ul className="items-grid">
						{items.map(item => (
							<li 
								key={item.id} 
								onClick={() => handleSelectItems(item.id)}
								className={selectedItems.includes(item.id) ? 'selected' : ''}
							>
								<img src={item.image_url} alt={item.title} />
								<span>{item.title}</span>
							</li>
						))}
					</ul>

					<button type="submit">
						Cadastrar ponto de coleta
					</button>
				</form>
			</div>
    ) 
}

export default CreatePoint;